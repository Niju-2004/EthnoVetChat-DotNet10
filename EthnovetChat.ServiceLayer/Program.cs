
namespace EthnovetChat.ServiceLayer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();

            // Register EthnoVet Core Services
            builder.Services.AddSingleton<EthnovetChat.DataAccessLayer.Repositories.IEthnovetRepository, EthnovetChat.DataAccessLayer.Repositories.EthnovetRepository>();
            builder.Services.AddSingleton<EthnovetChat.ServiceLayer.Services.ISessionService, EthnovetChat.ServiceLayer.Services.SessionService>();
            builder.Services.AddSingleton<EthnovetChat.ServiceLayer.Services.IRagService, EthnovetChat.ServiceLayer.Services.RagService>();
            builder.Services.AddHttpClient<EthnovetChat.ServiceLayer.Services.IGeminiService, EthnovetChat.ServiceLayer.Services.GeminiService>();
            builder.Services.AddScoped<EthnovetChat.ServiceLayer.Services.IChatService, EthnovetChat.ServiceLayer.Services.ChatService>();

            // Enable CORS for web / mobile clients
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/openapi/v1.json", "EthnoVet Chat API v1");
                    options.RoutePrefix = "swagger";
                });
                Scalar.AspNetCore.ScalarEndpointRouteBuilderExtensions.MapScalarApiReference(app);
            }

            // Redirect root to swagger
            app.MapGet("/", () => Results.Redirect("/swagger"));

            app.UseHttpsRedirection();

            app.UseCors("AllowAll");

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
