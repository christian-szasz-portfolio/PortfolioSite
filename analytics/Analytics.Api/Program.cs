using System.Text.Json;
using Analytics.Api.Configuration;
using Analytics.Api.Health;
using Analytics.Infrastructure.Configuration;
using Analytics.Infrastructure.Diagnostics;
using Common.Diagnostics.Capture;
using Common.Security;
using Common.Security.Cors;
using Common.Security.Headers;
using Common.Web;
using FastEndpoints;
using Microsoft.Extensions.Logging;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddFastEndpoints();

// Registered as ILoggerProvider so the logging factory picks it up alongside the console one:
// this captures for the digest, it does not replace anything.
builder.Services.AddSingleton<ILoggerProvider>(provider => ActivatorUtilities.CreateInstance<CapturingLoggerProvider>(
    provider, PortfolioApps.Analytics));
builder.Services.AddCounter(builder.Configuration).AddCounterHttp();

// Readiness, answered at /health/ready by HealthMiddleware rather than by MapHealthChecks: the
// probe has to reach it before the rate limiter, and everything mapped as an endpoint sits after.
builder.Services.AddHealthChecks()
    .AddCheck<StorageHealthCheck>(StorageHealthCheck.Name)
    .AddCheck<WorkerHealthCheck>(WorkerHealthCheck.Name);

WebApplication app = builder.Build();

// Outermost first. Security headers wrap everything, so a refusal carries them too;
// CORS wraps the limiter, so a 429 is still readable by an allowed origin.
app.UseMiddleware<SecurityHeadersMiddleware>();

// Before the limiter, so the platform's probe cannot spend a caller's allowance or be refused.
app.UseMiddleware<HealthMiddleware>();

app.UseMiddleware<CorsMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

// Emit idiomatic camelCase JSON ({ total, countries: [{ code, count }] }).
app.UseFastEndpoints(config =>
    config.Serializer.Options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

app.Run();
