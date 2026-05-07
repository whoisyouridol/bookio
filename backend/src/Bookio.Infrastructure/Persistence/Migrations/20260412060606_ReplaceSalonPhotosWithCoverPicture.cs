using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bookio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceSalonPhotosWithCoverPicture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Photos",
                table: "Salons");

            migrationBuilder.AddColumn<string>(
                name: "CoverPicture",
                table: "Salons",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverPicture",
                table: "Salons");

            migrationBuilder.AddColumn<string>(
                name: "Photos",
                table: "Salons",
                type: "jsonb",
                nullable: false,
                defaultValue: "");
        }
    }
}
