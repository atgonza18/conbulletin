export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface BulletinPost {
  id: string;
  title: string;
  content: string;
  date: Date;
  author: string;
  actionItems: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  title: string;
  content: string;
  author: string;
  actionItems: string[];
}
