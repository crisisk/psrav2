"""Python bindings for the native PSR Rules-as-Code validator."""
from __future__ import annotations

import importlib
import os
import pathlib
import subprocess
import sys
from typing import List, Sequence, Tuple

_PACKAGE_ROOT = pathlib.Path(__file__).resolve().parent
_PROJECT_ROOT = _PACKAGE_ROOT.parent
_MANIFEST_PATH = _PROJECT_ROOT / "validator-rs" / "Cargo.toml"
_ENV_DISABLE_AUTO_BUILD = "PSR_VALIDATOR_DISABLE_AUTO_BUILD"


def _build_native_module() -> None:
    if os.environ.get(_ENV_DISABLE_AUTO_BUILD) == "1":
        raise ModuleNotFoundError(
            "psr_validator native module is missing and automatic builds are disabled"
        )
    if not _MANIFEST_PATH.exists():
        raise ModuleNotFoundError("psr_validator native manifest not found")
    env = os.environ.copy()
    env.setdefault("VIRTUAL_ENV", sys.prefix)
    subprocess.run(
        [
            "maturin",
            "develop",
            "--manifest-path",
            str(_MANIFEST_PATH),
            "--quiet",
        ],
        cwd=_PROJECT_ROOT.parent,
        env=env,
        check=True,
    )


def _load_native():
    try:
        return importlib.import_module("psr_validator")
    except ModuleNotFoundError:
        _build_native_module()
        return importlib.import_module("psr_validator")


def validate_rule(schema_path: os.PathLike[str] | str, rule_path: os.PathLike[str] | str) -> List[str]:
    native = _load_native()
    return list(native.validate_rule(str(schema_path), str(rule_path)))


def validate_rule_text(schema_path: os.PathLike[str] | str, yaml_text: str) -> List[str]:
    native = _load_native()
    return list(native.validate_rule_str(str(schema_path), yaml_text))


def validate_directory(
    schema_path: os.PathLike[str] | str,
    directory: os.PathLike[str] | str,
) -> List[Tuple[str, List[str]]]:
    native = _load_native()
    results: Sequence[Tuple[str, Sequence[str]]] = native.validate_directory(
        str(schema_path), str(directory)
    )
    return [(path, list(errors)) for path, errors in results]


__all__ = [
    "validate_rule",
    "validate_rule_text",
    "validate_directory",
]
