const premises = {
  general: [
    'A sealed archive loses a rare map during a quiet evening reception.',
    'A private observatory records an impossible change just before its curator disappears.',
    'A theatre prop vanishes from a locked dressing room before opening night.',
  ],
  locked_room: [
    'A rare mechanical watch disappears from a locked study during a brief power cut.',
    'A conservator is found missing from a room whose only door was sealed from inside.',
    'A signed letter vanishes from a locked reading room while every guest remains in the hall.',
  ],
  art_theft: [
    'A miniature painting disappears during a gallery event where every visitor was counted.',
    'A sculpture is replaced with a convincing replica before a museum inspection.',
    'A restored portrait is altered hours before its first public exhibition.',
  ],
  disappearance: [
    'A lighthouse keeper vanishes during a calm night, leaving a carefully updated logbook.',
    'A stage magician misses the final curtain, while their sealed dressing room remains untouched.',
    'A botanist disappears from a greenhouse shortly before a rare flower blooms.',
  ],
  historical: [
    'A fictional royal observatory loses its only record of a comet sighting.',
    'A coded journal disappears from a remote manor during a winter gathering.',
    'A ceremonial key vanishes from a restored railway station before its reopening.',
  ],
  espionage: [
    'A fictional research institute discovers that a harmless decoy file has been replaced.',
    'A coded message goes missing from a diplomatic reception in an entirely fictional city.',
    'A prototype disappears from a fictional lab during a scheduled equipment test.',
  ],
};

export function randomPremise(category = 'general') {
  const options = premises[category] || premises.general;
  return options[Math.floor(Math.random() * options.length)];
}
