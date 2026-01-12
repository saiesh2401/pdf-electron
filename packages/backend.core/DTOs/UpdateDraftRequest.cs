// Purpose: DTO for updating a draft.
using System.Text.Json;

namespace Backend.Core.DTOs;

public record UpdateDraftRequest(
    JsonElement? FormData,
    JsonElement? Annotations,
    string? DrawingDataUrl
);
