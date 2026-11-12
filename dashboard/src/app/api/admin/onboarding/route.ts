import { NextRequest } from 'next/server';
import { handleGetOnboardings } from './_helpers/getOnboardings';
import { handlePostOnboarding, handlePutOnboarding } from './_helpers/mutateOnboardings';

export async function GET(request: NextRequest) {
  return handleGetOnboardings(request);
}

export async function POST(request: NextRequest) {
  return handlePostOnboarding(request);
}

export async function PUT(request: NextRequest) {
  return handlePutOnboarding(request);
}
