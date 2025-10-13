from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .repo import OnboardingRepo
from .schemas import StepOut, ProgressOut, CompleteIn, TipOut
from app.modules.platform.mailer import send_email

router = APIRouter()

@router.get("/onboarding/steps", response_model=list[StepOut])
