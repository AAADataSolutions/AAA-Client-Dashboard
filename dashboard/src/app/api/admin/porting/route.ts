import { NextRequest } from 'next/server';
import { handleGetPortings } from './_helpers/getPortings';
import { handlePostPorting } from './_helpers/postPorting';
import { handlePatchPorting } from './_helpers/patchPorting';
import { handleDeletePorting } from './_helpers/syncPortingEntities';

export async function GET(request: NextRequest) {
  return handleGetPortings(request);
}

export async function POST(request: NextRequest) {
  return handlePostPorting(request);
}

export async function PATCH(request: NextRequest) {
  return handlePatchPorting(request);
}

export async function DELETE(request: NextRequest) {
  return handleDeletePorting(request);
}
