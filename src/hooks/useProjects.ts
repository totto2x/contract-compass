import { useState, useEffect } from 'react';
import { DatabaseService, type ProjectWithDocumentCount } from '../lib/database';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithDocumentCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await DatabaseService.getProjects(user.id);
      setProjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load projects:', err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const createProject = async (projectData: {
    project_name: string;
    counterparty?: string;
    tags?: string[];
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newProject = await DatabaseService.createProject(projectData, user.id);
      // Refetch projects to get updated counts
      await fetchProjects();
      toast.success('Project created successfully');
      return newProject;
    } catch (err: any) {
      toast.error('Failed to create project');
      throw err;
    }
  };

  const updateProject = async (
    projectId: string,
    updates: Partial<Pick<ProjectWithDocumentCount, 'project_name' | 'counterparty' | 'tags'>>
  ) => {
    try {
      const updatedProject = await DatabaseService.updateProject(projectId, updates);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatedProject } : p));
      toast.success('Project updated successfully');
      return updatedProject;
    } catch (err: any) {
      toast.error('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await DatabaseService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete project');
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
};