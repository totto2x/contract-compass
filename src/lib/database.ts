import { supabase } from './supabase';
import type { AuthUser } from './auth';

interface DatabaseProject {
  id: string;
  user_id_created: string;
  project_name: string;
  counterparty: string | null;
  tags: string[];
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface DatabaseDocument {
  document_id: string;
  project_id: string;
  name: string;
  type: 'base' | 'amendment';
  file_path: string;
  file_size: number;
  mime_type: string;
  creation_date: string;
  upload_status: 'pending' | 'uploading' | 'complete' | 'error';
  processed_at: string | null;
  metadata: Record<string, any>;
  // New fields for text extraction and classification
  extracted_text?: string | null;
  text_extraction_status?: 'pending' | 'processing' | 'complete' | 'failed';
  text_extraction_error?: string | null;
  classification_role?: 'base' | 'amendment' | 'ancillary';
  execution_date?: string | null;
  effective_date?: string | null;
  amends_document?: string | null;
  classification_confidence?: number;
}

export interface ProjectWithDocumentCount extends DatabaseProject {
  document_count: number;
}

export interface MergedContractResult {
  id: string;
  project_id: string;
  base_summary: string;
  amendment_summaries: Array<{
    document: string;
    role: 'amendment' | 'ancillary';
    changes: string[];
  }>;
  clause_change_log: Array<{
    section: string;
    change_type: 'modified' | 'added' | 'deleted';
    old_text: string;
    new_text: string;
    summary: string;
  }>;
  final_contract: string;
  document_incorporation_log: string[];
  merge_status: 'processing' | 'complete' | 'error';
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  // Projects
  static async getProjects(userId: string): Promise<ProjectWithDocumentCount[]> {
    // First get all projects for the user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id_created', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    if (!projects || projects.length === 0) {
      return [];
    }

    // Get document counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const { count, error: countError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        if (countError) {
          console.error('Error counting documents for project', project.id, countError);
          return {
            ...project,
            document_count: 0
          };
        }

        return {
          ...project,
          document_count: count || 0
        };
      })
    );

    return projectsWithCounts;
  }

  static async createProject(projectData: {
    project_name: string;
    counterparty?: string;
    tags?: string[];
  }, userId: string): Promise<DatabaseProject> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id_created: userId,
        project_name: projectData.project_name,
        counterparty: projectData.counterparty || null,
        tags: projectData.tags || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(
    projectId: string, 
    updates: Partial<Pick<DatabaseProject, 'project_name' | 'counterparty' | 'tags'>>
  ): Promise<DatabaseProject> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'deleted' })
      .eq('id', projectId);

    if (error) throw error;
  }

  // Documents
  static async getDocuments(projectId: string): Promise<DatabaseDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('creation_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createDocument(documentData: {
    project_id: string;
    name: string;
    type: 'base' | 'amendment';
    file_path: string;
    file_size: number;
    mime_type: string;
    // Optional text extraction data
    extracted_text?: string;
    text_extraction_status?: 'pending' | 'processing' | 'complete' | 'failed';
    text_extraction_error?: string;
    // Optional classification data
    classification_role?: 'base' | 'amendment' | 'ancillary';
    execution_date?: string | null;
    effective_date?: string | null;
    amends_document?: string | null;
    classification_confidence?: number;
  }): Promise<DatabaseDocument> {
    // Prepare metadata with classification information
    const metadata = {
      classification_role: documentData.classification_role,
      execution_date: documentData.execution_date,
      effective_date: documentData.effective_date,
      amends_document: documentData.amends_document,
      classification_confidence: documentData.classification_confidence
    };

    const { data, error } = await supabase
      .from('documents')
      .insert({
        project_id: documentData.project_id,
        name: documentData.name,
        type: documentData.type,
        file_path: documentData.file_path,
        file_size: documentData.file_size,
        mime_type: documentData.mime_type,
        extracted_text: documentData.extracted_text,
        text_extraction_status: documentData.text_extraction_status || 'pending',
        text_extraction_error: documentData.text_extraction_error,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    
    // Add classification fields to the returned object
    return {
      ...data,
      classification_role: documentData.classification_role,
      execution_date: documentData.execution_date,
      effective_date: documentData.effective_date,
      amends_document: documentData.amends_document,
      classification_confidence: documentData.classification_confidence
    };
  }

  static async updateDocumentStatus(
    documentId: string,
    status: 'pending' | 'uploading' | 'complete' | 'error'
  ): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ 
        upload_status: status,
        processed_at: status === 'complete' ? new Date().toISOString() : null
      })
      .eq('document_id', documentId);

    if (error) throw error;
  }

  static async updateDocumentTextExtraction(
    documentId: string,
    extractedText: string,
    status: 'complete' | 'failed',
    error?: string
  ): Promise<void> {
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extractedText,
        text_extraction_status: status,
        text_extraction_error: error || null
      })
      .eq('document_id', documentId);

    if (updateError) throw updateError;
  }

  static async updateDocumentClassification(
    documentId: string,
    classificationData: {
      classification_role: 'base' | 'amendment' | 'ancillary';
      execution_date?: string | null;
      effective_date?: string | null;
      amends_document?: string | null;
      classification_confidence?: number;
    }
  ): Promise<void> {
    // Get current metadata
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('document_id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Merge with existing metadata
    const updatedMetadata = {
      ...(currentDoc.metadata || {}),
      ...classificationData
    };

    const { error } = await supabase
      .from('documents')
      .update({ metadata: updatedMetadata })
      .eq('document_id', documentId);

    if (error) throw error;
  }

  static async deleteDocument(documentId: string): Promise<void> {
    // First get the document to get the file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('document_id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('document_id', documentId);

    if (error) throw error;
  }

  // Get documents with extracted text for contract merging
  static async getDocumentsWithText(projectId: string): Promise<DatabaseDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('text_extraction_status', 'complete')
      .not('extracted_text', 'is', null)
      .order('creation_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get documents for merging with classification information
  static async getDocumentsForMerging(projectId: string): Promise<{
    baseDocuments: DatabaseDocument[];
    amendments: DatabaseDocument[];
    ancillaryDocuments: DatabaseDocument[];
    chronologicalOrder: DatabaseDocument[];
  }> {
    const documents = await this.getDocumentsWithText(projectId);
    
    const baseDocuments = documents.filter(doc => 
      doc.metadata?.classification_role === 'base' || doc.type === 'base'
    );
    
    const amendments = documents.filter(doc => 
      doc.metadata?.classification_role === 'amendment' || doc.type === 'amendment'
    ).sort((a, b) => {
      // Sort by execution date or effective date
      const dateA = new Date(a.metadata?.execution_date || a.metadata?.effective_date || a.creation_date);
      const dateB = new Date(b.metadata?.execution_date || b.metadata?.effective_date || b.creation_date);
      return dateA.getTime() - dateB.getTime();
    });
    
    const ancillaryDocuments = documents.filter(doc => 
      doc.metadata?.classification_role === 'ancillary'
    );

    // Create chronological order based on execution/effective dates
    const chronologicalOrder = [...documents].sort((a, b) => {
      const dateA = new Date(a.metadata?.execution_date || a.metadata?.effective_date || a.creation_date);
      const dateB = new Date(b.metadata?.execution_date || b.metadata?.effective_date || b.creation_date);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      baseDocuments,
      amendments,
      ancillaryDocuments,
      chronologicalOrder
    };
  }

  // Get document count for a specific project
  static async getProjectDocumentCount(projectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting document count:', error);
      return 0;
    }

    return count || 0;
  }

  // Merged Contract Results
  static async saveMergedContractResult(
    projectId: string,
    mergeResult: {
      base_summary: string;
      amendment_summaries: Array<{
        document: string;
        role: 'amendment' | 'ancillary';
        changes: string[];
      }>;
      clause_change_log: Array<{
        section: string;
        change_type: 'modified' | 'added' | 'deleted';
        old_text: string;
        new_text: string;
        summary: string;
      }>;
      final_contract: string;
      document_incorporation_log: string[];
    }
  ): Promise<MergedContractResult> {
    const { data, error } = await supabase
      .from('merged_contract_results')
      .insert({
        project_id: projectId,
        base_summary: mergeResult.base_summary,
        amendment_summaries: mergeResult.amendment_summaries,
        clause_change_log: mergeResult.clause_change_log,
        final_contract: mergeResult.final_contract,
        document_incorporation_log: mergeResult.document_incorporation_log,
        merge_status: 'complete'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getMergedContractResult(projectId: string): Promise<MergedContractResult | null> {
    const { data, error } = await supabase
      .from('merged_contract_results')
      .select('*')
      .eq('project_id', projectId)
      .eq('merge_status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  static async updateMergedContractResultStatus(
    resultId: string,
    status: 'processing' | 'complete' | 'error',
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('merged_contract_results')
      .update({
        merge_status: status,
        error_message: errorMessage || null
      })
      .eq('id', resultId);

    if (error) throw error;
  }

  static async deleteMergedContractResult(resultId: string): Promise<void> {
    const { error } = await supabase
      .from('merged_contract_results')
      .delete()
      .eq('id', resultId);

    if (error) throw error;
  }

  // File Storage
  static async uploadFile(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  }

  static async downloadFile(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error) throw error;
    return data;
  }

  static getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Statistics
  static async getUserStats(userId: string) {
    // Get project count
    const { count: projectCount, error: projectError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id_created', userId)
      .eq('status', 'active');

    if (projectError) throw projectError;

    // First get the project IDs for the user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id_created', userId)
      .eq('status', 'active');

    if (projectsError) throw projectsError;

    // Extract project IDs into an array
    const projectIds = projects?.map(project => project.id) || [];

    // Get document count using the array of project IDs
    let documentCount = 0;
    if (projectIds.length > 0) {
      const { count, error: documentError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      if (documentError) throw documentError;
      documentCount = count || 0;
    }

    return {
      projectCount: projectCount || 0,
      documentCount: documentCount
    };
  }
}