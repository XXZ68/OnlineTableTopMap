using GameMapBackend.Features.Grid;
using GameMapBackend.Features.Spell;
using GameMapBackend.Features.Token;
using GameMapBackend.Features.Character;

namespace GameMapBackend.Hubs;

public interface IMapClient
{
    Task TokenSpawned(MapTokenDto token);
    Task TokenMoved(Guid tokenId, int newGridX, int newGridY);
    Task TokenHpChanged(Guid tokenId, int newHp);
    Task CharacterUpdated(CharacterDto character);
    Task TokenRemoved(Guid tokenId);

    Task GridUpdated(GridDto grid);
    Task MapChanged(Guid newMapId);

    Task SpellCasted(SpellCastEventDto spellEvent);
    Task SpellDismissed(Guid activeSpellEffectId);

    Task PlayerJoined(string playerId, string playerName);
    Task PlayerLeft(string playerId);
}
