@echo off
set "ROOT=%~dp0"
set "DOTNET_CLI_HOME=%ROOT%..\.dotnet_home"
set "DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1"
set "NUGET_PACKAGES=%ROOT%..\.nuget_packages"
set "APPDATA=%ROOT%..\.appdata"
set "LOCALAPPDATA=%ROOT%..\.localappdata"
cd /d "%ROOT%server\PatiLink.Api"
dotnet run --no-restore --urls http://localhost:5147 --project "%ROOT%server\PatiLink.Api\PatiLink.Api.csproj"
