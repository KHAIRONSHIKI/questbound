import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getRankBadge, determineRank } from '../utils/ranks';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AvatarWithRankProps = {
  level: number;
  size?: number;
};

export default function AvatarWithRank({ level, size = 50 }: AvatarWithRankProps) {
  const rankName = determineRank(level);
  const rankImage = getRankBadge(rankName);

  const getRankBorderColor = (rank: string) => {
    switch(rank.toLowerCase()) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#00ffff';
      case 'diamond': return '#b9f2ff';
      default: return '#cf77f3';
    }
  };

  const getRankBorderWidth = (rank: string) => {
    switch(rank.toLowerCase()) {
      case 'bronze': return 2;
      case 'silver': return 2;
      case 'gold': return 3;
      case 'platinum': return 3;
      case 'diamond': return 4;
      default: return 2;
    }
  };

  const borderColor = getRankBorderColor(rankName);
  const borderWidth = getRankBorderWidth(rankName);

  return (
    <View style={{ width: size, height: size }}>
      <View style={[
        styles.avatarContainer, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderColor: borderColor,
          borderWidth: borderWidth,
          shadowColor: borderColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: borderWidth * 2,
          elevation: borderWidth * 2,
        }
      ]}>
        <Image
          source={rankImage}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '95%',
    height: '95%',
  }
});
