"""Optimize database indexes"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = 'optimize_indexes'
down_revision = None  # Replace with actual previous revision
branch_labels = None
depends_on = None

def upgrade():
    # Add missing indexes based on slow query analysis (e.g., on frequently queried columns)
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_orders_user_id', 'orders', ['user_id'])
    op.create_index('idx_products_category_id', 'products', ['category_id'])
    
    # Remove unused indexes (identified via pg_stat_user_indexes where idx_scan = 0)
    op.drop_index('idx_unused_example', table_name='example_table')

def downgrade():
    # Reverse operations
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_orders_user_id', table_name='orders')
    op.drop_index('idx_products_category_id', table_name='products')
    
    op.create_index('idx_unused_example', 'example_table', ['unused_column'])