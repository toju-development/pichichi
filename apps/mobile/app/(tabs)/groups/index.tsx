/**
 * Groups list screen — uses branded ScreenHeader + EmptyState.
 *
 * Will eventually show: list of groups, create/join buttons.
 */

import { View } from 'react-native';

import { GroupIcon } from '@/components/brand/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';

export default function GroupsScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Mis Grupos" gradient={true} />

      <EmptyState
        icon={<GroupIcon size={40} color="#0B6E4F" />}
        title="No tenés grupos todavía"
        description="Creá un grupo o unite con un código de invitación"
        action={{ label: 'Crear grupo', onPress: () => {} }}
      />
    </View>
  );
}
