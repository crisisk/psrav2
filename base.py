# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.organization import Organization  # noqa
from app.models.product import Product  # noqa
from app.models.component import Component  # noqa
from app.models.trade_agreement import TradeAgreement  # noqa
from app.models.origin_calculation import OriginCalculation  # noqa
from app.models.report import Report  # noqa
from app.models.webhook import Webhook  # noqa
