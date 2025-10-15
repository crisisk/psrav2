# /home/vncuser/psra-ltsd-enterprise-v2/backend/alembic/versions/add_performance_indexes.py

"""Add performance indexes for PSRA queries"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_performance_indexes'
down_revision = None  # Replace with the actual previous revision ID if known
branch_labels = None
depends_on = None

def upgrade():
    # Indexes for certificates table
    op.create_index('ix_certificates_certificate_number', 'certificates', ['certificate_number'], unique=True)
    op.create_index('ix_certificates_status_issue_date_active', 'certificates', ['status', 'issue_date'], postgresql_where=sa.text("status = 'active'"))
    op.create_index('ix_certificates_origin_dest', 'certificates', ['origin_country', 'destination_country'])
    op.create_index('ix_certificates_fta_agreement', 'certificates', ['fta_agreement'])
    # BRIN index for created_at (timestamp column, good for large tables with sequential data)
    op.execute("CREATE INDEX ix_certificates_created_at_brin ON certificates USING brin (created_at);")
    # GIN indexes for text search on exporter and importer (assuming they are text columns)
    op.execute("CREATE INDEX ix_certificates_exporter_gin ON certificates USING gin (to_tsvector('english', exporter));")
    op.execute("CREATE INDEX ix_certificates_importer_gin ON certificates USING gin (to_tsvector('english', importer));")

    # Indexes for evaluations table
    op.create_index('ix_evaluations_certificate_id', 'evaluations', ['certificate_id'])
    # BRIN index for evaluation_date
    op.execute("CREATE INDEX ix_evaluations_evaluation_date_brin ON evaluations USING brin (evaluation_date);")
    op.create_index('ix_evaluations_result', 'evaluations', ['result'])

    # Indexes for rules table
    # B-tree index on hs_code for range queries
    op.create_index('ix_rules_hs_code', 'rules', ['hs_code'])
    op.create_index('ix_rules_fta_agreement_id', 'rules', ['fta_agreement_id'])
    op.create_index('ix_rules_rule_type', 'rules', ['rule_type'])

    # Indexes for materials table
    op.create_index('ix_materials_certificate_id', 'materials', ['certificate_id'])
    op.create_index('ix_materials_hs_code', 'materials', ['hs_code'])

def downgrade():
    # Drop indexes for materials table
    op.drop_index('ix_materials_hs_code', table_name='materials')
    op.drop_index('ix_materials_certificate_id', table_name='materials')

    # Drop indexes for rules table
    op.drop_index('ix_rules_rule_type', table_name='rules')
    op.drop_index('ix_rules_fta_agreement_id', table_name='rules')
    op.drop_index('ix_rules_hs_code', table_name='rules')

    # Drop indexes for evaluations table
    op.drop_index('ix_evaluations_result', table_name='evaluations')
    op.execute("DROP INDEX ix_evaluations_evaluation_date_brin;")
    op.drop_index('ix_evaluations_certificate_id', table_name='evaluations')

    # Drop indexes for certificates table
    op.execute("DROP INDEX ix_certificates_importer_gin;")
    op.execute("DROP INDEX ix_certificates_exporter_gin;")
    op.execute("DROP INDEX ix_certificates_created_at_brin;")
    op.drop_index('ix_certificates_fta_agreement', table_name='certificates')
    op.drop_index('ix_certificates_origin_dest', table_name='certificates')
    op.drop_index('ix_certificates_status_issue_date_active', table_name='certificates')
    op.drop_index('ix_certificates_certificate_number', table_name='certificates')
