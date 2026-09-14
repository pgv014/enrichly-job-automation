import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJob } from "@/lib/execute";

export async function GET() {
  try {
    const executions = await prisma.execution.findMany({
      include: {
        job: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("GET /api/executions error:", error);

    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const execution = await prisma.execution.create({
      data: {
        jobId,
        status: "queued",
      },
    });

    void executeJob(execution.id);

    return NextResponse.json(execution, { status: 202 });
  } catch (error) {
    console.error("POST /api/executions error:", error);

    return NextResponse.json(
      { error: "Failed to create execution" },
      { status: 500 }
    );
  }
}
