'use client';

import { ProjectForm } from '@/components/portfolio/ProjectForm';

export default function Page() {
  return (
    <div className="container mx-auto py-8">
      <ProjectForm mode="add" />
    </div>
  );
} 