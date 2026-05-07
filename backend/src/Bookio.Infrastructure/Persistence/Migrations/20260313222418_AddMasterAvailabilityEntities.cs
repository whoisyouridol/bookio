using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bookio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMasterAvailabilityEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MasterDateOverrides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SalonMasterId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    IsDayOff = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterDateOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterDateOverrides_SalonMasters_SalonMasterId",
                        column: x => x.SalonMasterId,
                        principalTable: "SalonMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MasterTimeOffs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SalonMasterId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterTimeOffs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterTimeOffs_SalonMasters_SalonMasterId",
                        column: x => x.SalonMasterId,
                        principalTable: "SalonMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MasterWeeklySlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SalonMasterId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<string>(type: "text", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterWeeklySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterWeeklySlots_SalonMasters_SalonMasterId",
                        column: x => x.SalonMasterId,
                        principalTable: "SalonMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MasterDateOverrideSlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DateOverrideId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterDateOverrideSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterDateOverrideSlots_MasterDateOverrides_DateOverrideId",
                        column: x => x.DateOverrideId,
                        principalTable: "MasterDateOverrides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MasterDateOverrides_SalonMasterId_Date",
                table: "MasterDateOverrides",
                columns: new[] { "SalonMasterId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MasterDateOverrideSlots_DateOverrideId",
                table: "MasterDateOverrideSlots",
                column: "DateOverrideId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterTimeOffs_SalonMasterId_StartDate_EndDate",
                table: "MasterTimeOffs",
                columns: new[] { "SalonMasterId", "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_MasterWeeklySlots_SalonMasterId_DayOfWeek_StartTime",
                table: "MasterWeeklySlots",
                columns: new[] { "SalonMasterId", "DayOfWeek", "StartTime" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MasterDateOverrideSlots");

            migrationBuilder.DropTable(
                name: "MasterTimeOffs");

            migrationBuilder.DropTable(
                name: "MasterWeeklySlots");

            migrationBuilder.DropTable(
                name: "MasterDateOverrides");
        }
    }
}
