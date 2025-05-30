import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Content, ContentQueryParams, getContentList, getContentById, createContent, updateContent, deleteContent, incrementViewCount, updateFeedback } from '@/services/contentService';
import { useToast } from '@/components/ui/toast';

interface ContentQueryParamsWithId extends ContentQueryParams {
  id?: string;
}

interface ContentMutationContext {
  previousContent: any;
}

interface CreateContentParams extends Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'> {}

interface UpdateContentParams {
  id: string;
  content: Partial<Content>;
}

export const useContent = (params: ContentQueryParamsWithId = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [optimisticContent, setOptimisticContent] = useState<Content[]>([]);

  // Query for content list
  const { data: contentData, isLoading, error } = useQuery({
    queryKey: ['content', params],
    queryFn: () => getContentList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for single content
  const { data: content, isLoading: isLoadingContent } = useQuery({
    queryKey: ['content', params.id],
    queryFn: () => getContentById(params.id!),
    enabled: !!params.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create content mutation
  const createMutation = useMutation({
    mutationFn: (newContent: CreateContentParams) => createContent(newContent),
    onMutate: async (newContent: CreateContentParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['content'] });

      // Snapshot the previous value
      const previousContent = queryClient.getQueryData(['content']);

      // Optimistically update to the new value
      queryClient.setQueryData(['content'], (old: any) => ({
        content: [...(old?.content || []), { ...newContent, id: 'temp-id' }],
        lastDoc: old?.lastDoc
      }));

      // Return a context object with the snapshotted value
      return { previousContent };
    },
    onError: (error: Error, newContent: CreateContentParams, context: ContentMutationContext | undefined) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['content'], context?.previousContent);
      toast({
        title: 'Error',
        description: 'Failed to create content',
        variant: 'destructive'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content created successfully'
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Update content mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: UpdateContentParams) => updateContent(id, content),
    onMutate: async ({ id, content }: UpdateContentParams) => {
      await queryClient.cancelQueries({ queryKey: ['content'] });
      const previousContent = queryClient.getQueryData(['content']);
      
      queryClient.setQueryData(['content'], (old: any) => ({
        content: old?.content.map((item: Content) => 
          item.id === id ? { ...item, ...content } : item
        ),
        lastDoc: old?.lastDoc
      }));

      return { previousContent };
    },
    onError: (error: Error, variables: UpdateContentParams, context: ContentMutationContext | undefined) => {
      queryClient.setQueryData(['content'], context?.previousContent);
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content updated successfully'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContent(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['content'] });
      const previousContent = queryClient.getQueryData(['content']);
      
      queryClient.setQueryData(['content'], (old: any) => ({
        content: old?.content.filter((item: Content) => item.id !== id),
        lastDoc: old?.lastDoc
      }));

      return { previousContent };
    },
    onError: (error: Error, id: string, context: ContentMutationContext | undefined) => {
      queryClient.setQueryData(['content'], context?.previousContent);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content deleted successfully'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // View count mutation
  const viewMutation = useMutation({
    mutationFn: (id: string) => incrementViewCount(id),
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to update view count',
        variant: 'destructive'
      });
    }
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) => 
      updateFeedback(id, isHelpful),
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to update feedback',
        variant: 'destructive'
      });
    }
  });

  return {
    content: contentData?.content || [],
    lastDoc: contentData?.lastDoc,
    isLoading,
    isLoadingContent,
    error,
    createContent: createMutation.mutate,
    updateContent: updateMutation.mutate,
    deleteContent: deleteMutation.mutate,
    incrementViewCount: viewMutation.mutate,
    updateFeedback: feedbackMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}; 