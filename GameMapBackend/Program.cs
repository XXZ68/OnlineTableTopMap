using System.Reflection;
using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;
using GameMapBackend.Features.Character;
using GameMapBackend.Features.Compendium;
using GameMapBackend.Features.GameSession;
using GameMapBackend.Features.Grid;
using GameMapBackend.Features.Map;
using GameMapBackend.Features.Spell;
using GameMapBackend.Features.Token;
using GameMapBackend.Features.User;
using GameMapBackend.Hubs;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "D&D Game Map VTT API (.NET 10)",
        Version = "v1",
        Description = "Virtual Tabletop API for maps, dynamic grids, token synchronization, and 5e spells."
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=Database.db"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddScoped<
    IPasswordHasher<UserEntity>,
    PasswordHasher<UserEntity>
>();

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IMapService, MapService>();
builder.Services.AddScoped<IGridService, GridService>();
builder.Services.AddScoped<ICharacterService, CharacterService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ISpellService, SpellService>();
builder.Services.AddScoped<IGameSessionService, GameSessionService>();
builder.Services.AddScoped<ICompendiumService, CompendiumService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "D&D Game Map API v1"));
}
else
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("ReactApp");

app.UseAuthorization();

app.MapControllers();
app.MapHub<MapHub>("/hubs/map");

app.Run();
