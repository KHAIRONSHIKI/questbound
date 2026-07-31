export const getRankBadge = (rankName: string) => {
  const name = rankName?.toLowerCase() || '';
  
  if (name.includes('bronze') || name.includes('warrior')) {
    return require('../../assets/images/ranks/bronze.png');
  } else if (name.includes('silver')) {
    return require('../../assets/images/ranks/silver.png');
  } else if (name.includes('gold')) {
    return require('../../assets/images/ranks/gold.png');
  } else if (name.includes('platinum')) {
    return require('../../assets/images/ranks/platinum.png');
  } else if (name.includes('diamond')) {
    return require('../../assets/images/ranks/diamond.png');
  }
  
  // Fallback to default app icon if rank doesn't match or image doesn't exist yet
  return require('../../assets/images/icon.png');
};

export const determineRank = (level: number) => {
  if (level < 10) return 'Bronze';
  if (level < 20) return 'Silver';
  if (level < 30) return 'Gold';
  if (level < 40) return 'Platinum';
  return 'Diamond';
};
