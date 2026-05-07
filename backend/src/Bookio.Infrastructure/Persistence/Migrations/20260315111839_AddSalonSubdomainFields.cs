using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bookio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSalonSubdomainFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "Salons",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BorderRadius",
                table: "Salons",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Salons",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "Salons",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Salons",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Salons_Slug",
                table: "Salons",
                column: "Slug",
                unique: true,
                filter: "\"Slug\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Salons_Slug",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "AccentColor",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "BorderRadius",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "PrimaryColor",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Salons");
        }
    }
}
