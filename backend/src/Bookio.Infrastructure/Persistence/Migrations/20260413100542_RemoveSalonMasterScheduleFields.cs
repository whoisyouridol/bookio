using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bookio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSalonMasterScheduleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Migrate existing SalonMaster schedule data to MasterWeeklySlots
            // For any SalonMaster that has no weekly slots yet, create them from the legacy fields
            migrationBuilder.Sql(@"
                INSERT INTO ""MasterWeeklySlots"" (""Id"", ""SalonMasterId"", ""DayOfWeek"", ""StartTime"", ""EndTime"")
                SELECT
                    gen_random_uuid(),
                    sm.""Id"",
                    day_val::int,
                    sm.""WorkingHoursStart"",
                    sm.""WorkingHoursEnd""
                FROM ""SalonMasters"" sm
                CROSS JOIN LATERAL jsonb_array_elements_text(sm.""WorkingDays"") AS day_text
                CROSS JOIN LATERAL (
                    SELECT CASE day_text
                        WHEN '0' THEN 0 WHEN '1' THEN 1 WHEN '2' THEN 2
                        WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5 WHEN '6' THEN 6
                    END AS day_val
                ) AS dv
                WHERE sm.""IsActive"" = true
                  AND NOT EXISTS (
                    SELECT 1 FROM ""MasterWeeklySlots"" ws WHERE ws.""SalonMasterId"" = sm.""Id""
                  )
                  AND day_val IS NOT NULL;
            ");

            // Step 2: Drop the legacy columns
            migrationBuilder.DropColumn(
                name: "WorkingDays",
                table: "SalonMasters");

            migrationBuilder.DropColumn(
                name: "WorkingHoursEnd",
                table: "SalonMasters");

            migrationBuilder.DropColumn(
                name: "WorkingHoursStart",
                table: "SalonMasters");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WorkingDays",
                table: "SalonMasters",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "WorkingHoursEnd",
                table: "SalonMasters",
                type: "time without time zone",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));

            migrationBuilder.AddColumn<TimeOnly>(
                name: "WorkingHoursStart",
                table: "SalonMasters",
                type: "time without time zone",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));
        }
    }
}
