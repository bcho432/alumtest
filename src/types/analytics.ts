export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export interface StoryPromptAnalytics extends AnalyticsEvent {
  name: 'story_prompt_viewed' | 'story_answer_submitted' | 'story_answers_updated';
  properties?: {
    answerCount?: number;
    categories?: string[];
    path?: string;
    timestamp?: string;
  };
}

export interface TimelineAnalytics extends AnalyticsEvent {
  name: 'timeline_event_added' | 'timeline_event_removed' | 'timeline_event_updated';
  properties?: {
    eventType?: 'education' | 'job';
    eventCount?: number;
    hasEducationEvents?: boolean;
    hasJobEvents?: boolean;
    averageEventDuration?: number;
  };
} 