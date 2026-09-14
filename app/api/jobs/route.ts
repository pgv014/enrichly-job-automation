import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  endpoint: z.string().url(),
  schedule: z.string().optional(),
});

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
        executions: {
          orderBy: {
            startedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("GET /api/jobs error:", error);

    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        name: parsed.data.name,
        webhookUrl: parsed.data.endpoint,
        schedule: parsed.data.schedule ?? "manual",
        status: "active",
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);

    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}