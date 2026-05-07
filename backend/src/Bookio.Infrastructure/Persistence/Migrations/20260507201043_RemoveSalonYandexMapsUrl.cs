using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bookio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSalonYandexMapsUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "YandexMapsUrl",
                table: "Salons");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "YandexMapsUrl",
                table: "Salons",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }
    }
}
