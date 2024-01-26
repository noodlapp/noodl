import { useEffect, useState } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';

import { CollaboratorBadge, getBadgeForUser } from '@noodl-core-ui/utils/collaborator';

export interface Collaborator {
  id: string;
  email: string;
  name: string;
  badge: CollaboratorBadge;
}

// TODO: What type is this?
export type ProjectCollaborator = TSFixme;

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(null);

  //TODO: fetch from git (all commiters)

  return collaborators;
}
