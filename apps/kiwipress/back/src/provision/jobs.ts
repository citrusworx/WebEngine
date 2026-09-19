import { randomUUID } from "node:crypto";
import type { ProvisionEvent, ProvisionJob, ProvisionStep, TimelineStepId } from "./types.js";

export class ProvisionJobStore {
    private readonly jobs = new Map<string, ProvisionJob>();

    create(input: { packId: ProvisionJob["packId"]; steps: ProvisionStep[] }): ProvisionJob {
        const now = new Date().toISOString();
        const job: ProvisionJob = {
            id: randomUUID(),
            status: "queued",
            packId: input.packId,
            steps: input.steps.map((step) => ({ ...step, status: "pending", logs: step.logs ? [...step.logs] : undefined })),
            events: [],
            createdAt: now,
            updatedAt: now
        };
        this.jobs.set(job.id, job);
        return job;
    }

    get(id: string): ProvisionJob | undefined {
        return this.jobs.get(id);
    }

    markRunning(id: string): ProvisionJob | undefined {
        const job = this.jobs.get(id);
        if (!job) {
            return undefined;
        }
        job.status = "running";
        job.updatedAt = new Date().toISOString();
        return job;
    }

    markSucceeded(id: string, result: ProvisionJob["result"]): ProvisionJob | undefined {
        const job = this.jobs.get(id);
        if (!job) {
            return undefined;
        }
        job.status = "succeeded";
        job.result = result;
        job.updatedAt = new Date().toISOString();
        return job;
    }

    markFailed(id: string, error: string): ProvisionJob | undefined {
        const job = this.jobs.get(id);
        if (!job) {
            return undefined;
        }
        job.status = "failed";
        job.error = error;
        job.updatedAt = new Date().toISOString();
        return job;
    }

    emit(id: string, stepId: TimelineStepId, status: ProvisionStep["status"], message?: string): ProvisionJob | undefined {
        const job = this.jobs.get(id);
        if (!job) {
            return undefined;
        }

        const at = new Date().toISOString();
        const event: ProvisionEvent = { at, stepId, status, message };
        job.events.push(event);
        job.updatedAt = at;

        job.steps = job.steps.map((step) => {
            if (step.id !== stepId) {
                return step;
            }
            return {
                ...step,
                status,
                timestamp: new Date(at).toLocaleTimeString(),
                logs: message ? [...(step.logs ?? []), message] : step.logs
            };
        });

        return job;
    }

    snapshot(id: string): ProvisionJob | undefined {
        const job = this.jobs.get(id);
        if (!job) {
            return undefined;
        }
        return {
            ...job,
            steps: job.steps.map((step) => ({ ...step, logs: step.logs ? [...step.logs] : undefined })),
            events: job.events.map((event) => ({ ...event }))
        };
    }
}
