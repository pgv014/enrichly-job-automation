import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      executions: {
        orderBy: {
          startedAt: "desc",
        },
      },
    },
  });

  return job
    ? NextResponse.json(job)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const job = await prisma.job.update({
    where: { id },
    data: { ...body },
  });

  return NextResponse.json(job);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.job.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
