export type NumericValidator = (value?: number) => string | null;

const nonNegative =
  (message: string): NumericValidator =>
  (value) => {
    if (value === undefined) {
      return null;
    }
    return value >= 0 ? null : message;
  };

const greaterThanZero =
  (message: string, required: boolean): NumericValidator =>
  (value) => {
    if (value === undefined) {
      return required ? message : null;
    }
    return value > 0 ? null : message;
  };

const withinRange =
  (message: string, min: number, max: number): NumericValidator =>
  (value) => {
    if (value === undefined) {
      return null;
    }
    return value >= min && value <= max ? null : message;
  };

export const validateLatencyMs = nonNegative("Latency must be greater or equal to 0 ms.");

export const validateCapacityRps = greaterThanZero("Capacity must be greater than 0 rps.", false);

export const validateFailureRate = withinRange("Failure rate must be between 0 and 1.", 0, 1);

export const validateCostPerHour = nonNegative("Cost per hour must be greater or equal to 0.");

export const validateWorkloadRps = greaterThanZero("Requests per second are required.", true);

export const validateWorkloadP95 = greaterThanZero("p95 target must be greater than 0 ms.", true);

export const validateWorkloadCostTarget = nonNegative("Cost target must be greater or equal to 0.");
