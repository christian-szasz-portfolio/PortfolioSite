# syntax=docker/dockerfile:1
# The analytics API, built from the repository root:
#
#     docker build -f analytics/Dockerfile --secret id=github_packages_user,env=GITHUB_PACKAGES_USER \
#         --secret id=github_packages_token,env=GITHUB_PACKAGES_TOKEN -t analytics-api .
#
# The context is the root rather than analytics/, because Directory.Build.props and .editorconfig
# live there and the build is warnings-as-errors: without them the image would build under
# different rules from the ones the code is written to.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# The project files first, on their own layer, so a source change does not re-restore packages.
COPY Directory.Build.props .editorconfig ./
COPY NuGet.config ./
COPY analytics/Analytics.Domain/Analytics.Domain.csproj analytics/Analytics.Domain/
COPY analytics/Analytics.Infrastructure/Analytics.Infrastructure.csproj analytics/Analytics.Infrastructure/
COPY analytics/Analytics.Api/Analytics.Api.csproj analytics/Analytics.Api/
# The shared Common.* packages come from the private GitHub Packages feed NuGet.config names.
# Its token is a build secret, so it never lands in a layer or the image history.
RUN --mount=type=secret,id=github_packages_user,env=GITHUB_PACKAGES_USER \
    --mount=type=secret,id=github_packages_token,env=GITHUB_PACKAGES_TOKEN \
    dotnet restore analytics/Analytics.Api/Analytics.Api.csproj

COPY analytics/ analytics/
RUN dotnet publish analytics/Analytics.Api/Analytics.Api.csproj -c Release -o /app --no-restore

# The full runtime image, not Alpine. Alpine ships without ICU, and the digest is scheduled in a
# named time zone: without ICU, Europe/Bucharest does not resolve and the host stops at startup.
# InvariantGlobalization stays off in the csproj for the same reason.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Nothing here needs to write to its own filesystem: counts go to the table, the digest goes to
# SMTP, and the GeoIP database is read-only. So it runs as a user that could not write anyway.
USER $APP_UID

COPY --from=build /app .

# The platform terminates TLS in front of this; the base image already serves plain HTTP on 8080.
EXPOSE 8080

ENTRYPOINT ["dotnet", "Analytics.Api.dll"]
