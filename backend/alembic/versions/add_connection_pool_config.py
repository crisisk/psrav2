"""add_connection_pool_config

Revision ID: 123456789abc
Revises: 
Create Date: 2023-10-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '123456789abc'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'connection_pool_config',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('pool_size', sa.Integer, nullable=False, default=20),
        sa.Column('max_overflow', sa.Integer, nullable=False, default=40),
        sa.Column('pool_timeout', sa.Integer, nullable=False, default=30),
        sa.Column('pool_recycle', sa.Integer, nullable=False, default=3600),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
    )

def downgrade():
    op.drop_table('connection_pool_config')