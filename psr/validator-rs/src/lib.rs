use jsonschema::{paths::JSONPointer, error::ValidationError, JSONSchema};
use pyo3::exceptions::PyRuntimeError;
use pyo3::prelude::*;
use rayon::prelude::*;
use serde_json::Value as JsonValue;
use serde_yaml::Value as YamlValue;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use thiserror::Error;
use walkdir::WalkDir;

#[derive(Debug, Error)]
enum ValidatorError {
    #[error("failed to open file {path:?}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to parse YAML {path:?}: {source}")]
    YamlParse {
        path: Option<PathBuf>,
        #[source]
        source: serde_yaml::Error,
    },
    #[error("failed to load JSON schema {path:?}: {source}")]
    Schema {
        path: PathBuf,
        #[source]
        source: serde_json::Error,
    },
    #[error("schema validation error: {0}")]
    Validation(String),
}

fn load_schema(schema_path: &Path) -> Result<JSONSchema, ValidatorError> {
    let file = File::open(schema_path).map_err(|source| ValidatorError::Io {
        path: schema_path.to_path_buf(),
        source,
    })?;
    let schema_json: JsonValue = serde_json::from_reader(file).map_err(|source| ValidatorError::Schema {
        path: schema_path.to_path_buf(),
        source,
    })?;
    JSONSchema::compile(&schema_json).map_err(|err| ValidatorError::Validation(err.to_string()))
}

fn read_yaml(path: &Path) -> Result<JsonValue, ValidatorError> {
    let mut file = File::open(path).map_err(|source| ValidatorError::Io {
        path: path.to_path_buf(),
        source,
    })?;
    let mut buf = String::new();
    file.read_to_string(&mut buf).map_err(|source| ValidatorError::Io {
        path: path.to_path_buf(),
        source,
    })?;
    parse_yaml_str(&buf, Some(path))
}

fn parse_yaml_str(contents: &str, origin: Option<&Path>) -> Result<JsonValue, ValidatorError> {
    let yaml: YamlValue = serde_yaml::from_str(contents).map_err(|source| ValidatorError::YamlParse {
        path: origin.map(|p| p.to_path_buf()),
        source,
    })?;
    let schema_path = origin
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("<memory>"));
    serde_json::to_value(yaml).map_err(|source| ValidatorError::Schema {
        path: schema_path,
        source,
    })
}

fn collect_errors(schema: &JSONSchema, data: &JsonValue) -> Vec<String> {
    schema
        .validate(data)
        .map(|_| Vec::new())
        .unwrap_or_else(|errors| errors.map(format_validation_error).collect())
}

fn format_validation_error(error: ValidationError<'_>) -> String {
    let instance_path = format_pointer(&error.instance_path);
    let schema_path = format_pointer(&error.schema_path);
    format!(
        "{kind} at {instance} (schema: {schema})",
        kind = error,
        instance = instance_path,
        schema = schema_path
    )
}

fn format_pointer(pointer: &JSONPointer) -> String {
    let rendered = pointer.to_string();
    if rendered.is_empty() {
        "/".to_string()
    } else {
        rendered
    }
}

fn ensure_schema_path(schema_path: &str) -> Result<PathBuf, ValidatorError> {
    let path = PathBuf::from(schema_path);
    if !path.exists() {
        return Err(ValidatorError::Io {
            path: path.clone(),
            source: std::io::Error::new(std::io::ErrorKind::NotFound, "schema not found"),
        });
    }
    Ok(path)
}

#[pyfunction]
fn validate_rule(schema_path: &str, rule_path: &str) -> PyResult<Vec<String>> {
    let schema_path = ensure_schema_path(schema_path).map_err(to_py_err)?;
    let schema = load_schema(&schema_path).map_err(to_py_err)?;
    let rule_path_buf = PathBuf::from(rule_path);
    let payload = read_yaml(&rule_path_buf).map_err(to_py_err)?;
    Ok(collect_errors(&schema, &payload))
}

#[pyfunction]
fn validate_rule_str(schema_path: &str, yaml_text: &str) -> PyResult<Vec<String>> {
    let schema_path = ensure_schema_path(schema_path).map_err(to_py_err)?;
    let schema = load_schema(&schema_path).map_err(to_py_err)?;
    let payload = parse_yaml_str(yaml_text, None).map_err(to_py_err)?;
    Ok(collect_errors(&schema, &payload))
}

#[pyfunction]
fn validate_directory(schema_path: &str, directory: &str) -> PyResult<Vec<(String, Vec<String>)>> {
    let schema_path = ensure_schema_path(schema_path).map_err(to_py_err)?;
    let schema = load_schema(&schema_path).map_err(to_py_err)?;
    let dir_path = PathBuf::from(directory);
    if !dir_path.exists() {
        return Err(to_py_err(ValidatorError::Io {
            path: dir_path,
            source: std::io::Error::new(std::io::ErrorKind::NotFound, "directory not found"),
        }));
    }

    let results: Vec<(String, Vec<String>)> = WalkDir::new(&dir_path)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| matches!(ext, "yml" | "yaml"))
                .unwrap_or(false)
        })
        .par_bridge()
        .map(|entry| {
            let path = entry.path().to_path_buf();
            let data = read_yaml(&path);
            match data {
                Ok(payload) => {
                    let errors = collect_errors(&schema, &payload);
                    (path.display().to_string(), errors)
                }
                Err(err) => (path.display().to_string(), vec![err.to_string()]),
            }
        })
        .collect();

    Ok(results)
}

fn to_py_err(err: ValidatorError) -> PyErr {
    PyRuntimeError::new_err(err.to_string())
}

#[pymodule]
fn psr_validator(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(validate_rule, m)?)?;
    m.add_function(wrap_pyfunction!(validate_rule_str, m)?)?;
    m.add_function(wrap_pyfunction!(validate_directory, m)?)?;
    Ok(())
}
