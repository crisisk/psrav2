import { NextResponse } from 'next/server';

type Stage = 'draft' | 'review' | 'approved' | 'rejected' | 'archived';
type StageTransitionRule = {
  fromStage: Stage;
  allowedToStages: Stage[];
  requiredRoles?: string[];
};

const transitionRules: StageTransitionRule[] = [
  {
    fromStage: 'draft',
    allowedToStages: ['review', 'archived'],
    requiredRoles: ['editor', 'admin']
  },
  {
    fromStage: 'review',
    allowedToStages: ['approved', 'rejected', 'archived'],
    requiredRoles: ['approver', 'admin']
  },
  {
    fromStage: 'approved',
    allowedToStages: ['archived'],
    requiredRoles: ['archivist', 'admin']
  },
  {
    fromStage: 'rejected',
    allowedToStages: ['draft', 'archived'],
    requiredRoles: ['editor', 'admin']
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentStage = searchParams.get('currentStage') as Stage | null;
    const nextStage = searchParams.get('nextStage') as Stage | null;
    const userRole = searchParams.get('userRole');

    // Validate input parameters
    if (!currentStage || !nextStage || !userRole) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Find applicable transition rule
    const rule = transitionRules.find(r => r.fromStage === currentStage);
    if (!rule) {
      return NextResponse.json(
        { isValid: false, error: 'No transition rules found for current stage' },
        { status: 404 }
      );
    }

    // Check stage transition validity
    const isValidStage = rule.allowedToStages.includes(nextStage);
    const hasValidRole = rule.requiredRoles
      ? rule.requiredRoles.includes(userRole)
      : true;

    return NextResponse.json({
      isValid: isValidStage && hasValidRole,
      message: isValidStage && hasValidRole
        ? 'Transition valid'
        : 'Transition forbidden',
      details: {
        stageValidation: isValidStage,
        roleValidation: hasValidRole
      }
    });

  } catch (error) {
    console.error('Stage transition validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
