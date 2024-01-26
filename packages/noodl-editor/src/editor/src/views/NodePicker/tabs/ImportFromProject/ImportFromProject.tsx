import React, { useMemo } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';
import { LocalProjectsModel } from '@noodl-utils/LocalProjectsModel';

import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import css from './ImportFromProject.module.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImportFromProjectProps {}

// eslint-disable-next-line no-empty-pattern
export function ImportFromProject({}: ImportFromProjectProps) {
  const projects = useMemo(() => LocalProjectsModel.instance.getProjects(), []);
  const currentProjectId = ProjectModel.instance.id;

  return (
    <div style={{ overflowY: 'scroll' }}>
      {Boolean(projects.length) && (
        <ul className={css['Grid']}>
          {projects.map((project) => {
            if (project.id === currentProjectId) return null;

            return (
              <li key={project.id} className={css['GridItem']}>
                <ProjectCard project={project} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
