using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameMapBackend.Migrations
{
    /// <inheritdoc />
    public partial class LinkGameSessionToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GameSessions_Users_UserEntityId",
                table: "GameSessions");

            migrationBuilder.DropIndex(
                name: "IX_GameSessions_JoinCode",
                table: "GameSessions");

            migrationBuilder.DropIndex(
                name: "IX_GameSessions_UserEntityId",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "UserEntityId",
                table: "GameSessions");

            migrationBuilder.CreateIndex(
                name: "IX_GameSessions_DungeonMasterId",
                table: "GameSessions",
                column: "DungeonMasterId");

            migrationBuilder.AddForeignKey(
                name: "FK_GameSessions_Users_DungeonMasterId",
                table: "GameSessions",
                column: "DungeonMasterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GameSessions_Users_DungeonMasterId",
                table: "GameSessions");

            migrationBuilder.DropIndex(
                name: "IX_GameSessions_DungeonMasterId",
                table: "GameSessions");

            migrationBuilder.AddColumn<Guid>(
                name: "UserEntityId",
                table: "GameSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameSessions_JoinCode",
                table: "GameSessions",
                column: "JoinCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameSessions_UserEntityId",
                table: "GameSessions",
                column: "UserEntityId");

            migrationBuilder.AddForeignKey(
                name: "FK_GameSessions_Users_UserEntityId",
                table: "GameSessions",
                column: "UserEntityId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
