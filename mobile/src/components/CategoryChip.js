/**
 * CategoryChip — filterable category tag.
 */
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';

export default function CategoryChip({ category, isSelected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={() => onPress?.(category)}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{category.icon}</Text>
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: fontSizes.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
  },
});
