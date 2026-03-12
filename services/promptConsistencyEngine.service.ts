import { FinalPromptContract } from "../schemas/finalPromptContract";

function resolveLightingTimeConflict(contract: FinalPromptContract): FinalPromptContract {
  const concept = contract.concept?.toLowerCase() ?? "";
  const lighting = contract.lighting?.toLowerCase() ?? "";

  const isNightScene =
    concept.includes("night") ||
    concept.includes("midnight") ||
    concept.includes("evening");

  if (isNightScene && lighting.includes("golden")) {
    contract.lighting = "Soft nighttime ambient lighting with subtle artificial illumination and natural low-light shadows.";
  }

  return contract;
}

function resolveIndoorSkyConflict(contract: FinalPromptContract): FinalPromptContract {
  const setting = contract.environment?.setting?.toLowerCase() ?? "";

  if (
    setting.includes("room") ||
    setting.includes("apartment") ||
    setting.includes("office") ||
    setting.includes("studio") ||
    setting.includes("interior")
  ) {
    if (contract.environment) {
      contract.environment.sky = "N/A";
      contract.environment.atmosphere = "N/A";
    }
  }

  return contract;
}

function resolveSceneLocationConflict(contract: FinalPromptContract): FinalPromptContract {
  const concept = contract.concept?.toLowerCase() ?? "";
  const setting = contract.environment?.setting?.toLowerCase() ?? "";

  if (concept.includes("apartment") && setting.includes("mountain")) {
    if (contract.environment) {
      contract.environment.setting =
        "A modern apartment interior with contemporary furnishings and soft natural window lighting.";
    }
  }

  return contract;
}

export function applyPromptConsistency(contract: FinalPromptContract): FinalPromptContract {
  // Deep clone to avoid mutating the original directly if needed, but direct mutation is fine here
  let consistentContract = JSON.parse(JSON.stringify(contract)) as FinalPromptContract;

  consistentContract = resolveLightingTimeConflict(consistentContract);
  consistentContract = resolveIndoorSkyConflict(consistentContract);
  consistentContract = resolveSceneLocationConflict(consistentContract);

  return consistentContract;
}
