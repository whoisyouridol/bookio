using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bookio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Migrate existing UserName (email-based) to stable GUID-based format
            migrationBuilder.Sql("""
                UPDATE "AspNetUsers"
                SET "UserName" = 'user_' || "Id"::text,
                    "NormalizedUserName" = UPPER('user_' || "Id"::text)
                WHERE "UserName" IS NOT NULL
                  AND "UserName" NOT LIKE 'user_%';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PhoneNumber",
                table: "AspNetUsers",
                column: "PhoneNumber",
                unique: true,
                filter: "\"PhoneNumber\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PhoneNumber",
                table: "AspNetUsers");
        }
    }
}
