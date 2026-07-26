import type { Book, Buddy, Note, Podcast, Profile } from './types';

export const SAMPLE_BOOKS: Array<Omit<Book, 'id' | 'created_at' | 'user_id'>> = [
  { title: 'The Overstory', author: 'Richard Powers', genre: 'Fiction', language: 'English', publisher: 'W. W. Norton', isbn: '9780393635225', status: 'reading', shelf: 'Living room' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Nonfiction', language: 'English', publisher: 'Harper', isbn: '9780062316097', status: 'finished', shelf: 'Study' },
  { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', language: 'English', publisher: 'Chilton Books', isbn: '9780441013593', status: 'finished', shelf: 'Living room' },
  { title: 'Pachinko', author: 'Min Jin Lee', genre: 'Fiction', language: 'English', publisher: 'Grand Central', isbn: '9781455563937', status: 'unread', shelf: 'Bedroom' },
  { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-help', language: 'English', publisher: 'Avery', isbn: '9780735211292', status: 'reading', shelf: 'Study' },
  { title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', language: 'English', publisher: 'Allen & Unwin', isbn: '9780547928227', status: 'finished', shelf: 'Kids room' },
  { title: 'Educated', author: 'Tara Westover', genre: 'Memoir', language: 'English', publisher: 'Random House', isbn: '9780399590504', status: 'unread', shelf: 'Bedroom' },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', genre: 'Sci-Fi', language: 'English', publisher: 'Faber & Faber', isbn: '9780571364886', status: 'reading', shelf: 'Living room' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Nonfiction', language: 'English', publisher: 'Farrar, Straus', isbn: '9780374533557', status: 'unread', shelf: 'Study' },
  { title: 'Normal People', author: 'Sally Rooney', genre: 'Fiction', language: 'English', publisher: 'Faber & Faber', isbn: '9780571334650', status: 'finished', shelf: 'Bedroom' },
];

export const SAMPLE_BUDDIES: Buddy[] = [
  {
    id: 'b1', name: 'Maya', color: '#5145e5', shared: 12, hoursLabel: '42h 0m', hasSharedShelf: true, blocked: false,
    sharedBooks: [
      { title: 'The Midnight Library', author: 'Matt Haig', color: '#3b6ea8' },
      { title: 'Becoming', author: 'Michelle Obama', color: '#8b4a3d' },
      { title: 'The Alchemist', author: 'Paulo Coelho', color: '#b8821b' },
      { title: 'Big Magic', author: 'Elizabeth Gilbert', color: '#6b8c42' },
      { title: 'Normal People', author: 'Sally Rooney', color: '#7a8b2e' },
    ],
  },
  {
    id: 'b2', name: 'Daniel', color: '#0ea5b7', shared: 5, hoursLabel: '13h 30m', hasSharedShelf: false, blocked: false,
    sharedBooks: [
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', color: '#6b4ea0' },
      { title: 'The Power of Now', author: 'Eckhart Tolle', color: '#2f6f4e' },
      { title: 'Zero to One', author: 'Peter Thiel', color: '#0ea5b7' },
    ],
  },
  {
    id: 'b3', name: 'Priya', color: '#e0892f', shared: 8, hoursLabel: '25h 45m', hasSharedShelf: true, blocked: false,
    sharedBooks: [
      { title: 'Pachinko', author: 'Min Jin Lee', color: '#8a3b6b' },
      { title: 'Circe', author: 'Madeline Miller', color: '#2f6f4e' },
      { title: 'Piranesi', author: 'Susanna Clarke', color: '#2a5b8c' },
      { title: 'The God of Small Things', author: 'Arundhati Roy', color: '#c1543b' },
    ],
  },
  {
    id: 'b4', name: 'Sam', color: '#8b5cf6', shared: 3, hoursLabel: '6h 0m', hasSharedShelf: false, blocked: false,
    sharedBooks: [
      { title: 'The Martian', author: 'Andy Weir', color: '#e0892f' },
      { title: 'Ready Player One', author: 'Ernest Cline', color: '#5145e5' },
      { title: 'Project Hail Mary', author: 'Andy Weir', color: '#2a5b8c' },
    ],
  },
  {
    id: 'b5', name: 'Mom', color: '#e85d8a', shared: 20, hoursLabel: '67h 0m', hasSharedShelf: true, blocked: false,
    sharedBooks: [
      { title: 'A Little Life', author: 'Hanya Yanagihara', color: '#5145e5' },
      { title: 'Eleanor Oliphant', author: 'Gail Honeyman', color: '#0ea5b7' },
      { title: 'The Kite Runner', author: 'Khaled Hosseini', color: '#e0892f' },
      { title: 'Where the Crawdads Sing', author: 'Delia Owens', color: '#3a7d7b' },
      { title: 'The Secret History', author: 'Donna Tartt', color: '#8b5cf6' },
    ],
  },
];

export const SAMPLE_NOTES: Array<Omit<Note, 'id' | 'createdAt'>> = [
  { text: 'Shared myths are what let strangers cooperate at scale — worth bringing up in the team talk.', color: '#c1543b', book: 'Sapiens', page: 241, urls: [], sharedBuddyIds: ['b1', 'b5'] },
  { text: 'Systems over goals. Designing the environment beats relying on willpower every day.', color: '#b8821b', book: 'Atomic Habits', page: 27, urls: [], sharedBuddyIds: [] },
  { text: '"Fear is the mind-killer." The litany actually works as a grounding exercise.', color: '#2a5b8c', book: 'Dune', page: 8, urls: [], sharedBuddyIds: ['b3'] },
  { text: 'Trees signal each other underground. Reframed how I see the woods behind the house.', color: '#2f6f4e', book: 'The Overstory', page: 153, urls: [], sharedBuddyIds: ['b2', 'b4'] },
];

export const SAMPLE_PODCASTS: Array<Omit<Podcast, 'id'>> = [
  { title: 'The Knowledge Project', topic: 'Decision Making', genre: 'Business', channel: 'Farnam Street', interviewee: 'Various', interviewer: 'Shane Parrish', url: 'https://fs.blog/knowledge-project-podcast/' },
  { title: 'How I Built This', topic: 'Entrepreneurship', genre: 'Business', channel: 'NPR', interviewee: 'Various', interviewer: 'Guy Raz', url: 'https://www.npr.org/series/how-i-built-this/' },
  { title: 'Huberman Lab', topic: 'Neuroscience & Health', genre: 'Science', channel: 'Huberman Lab', interviewee: 'Various', interviewer: 'Andrew Huberman', url: 'https://www.hubermanlab.com/podcast' },
  { title: 'Lex Fridman Podcast', topic: 'AI & Technology', genre: 'Technology', channel: 'Lex Fridman', interviewee: 'Various', interviewer: 'Lex Fridman', url: 'https://lexfridman.com/podcast/' },
  { title: 'Serial', topic: 'True Crime Investigation', genre: 'True Crime', channel: 'This American Life', interviewee: 'Various', interviewer: 'Sarah Koenig', url: 'https://serialpodcast.org/' },
  { title: 'Radiolab', topic: 'Science & Philosophy', genre: 'Science', channel: 'WNYC Studios', interviewee: 'Various', interviewer: 'Lulu Miller', url: 'https://www.wnycstudios.org/podcasts/radiolab' },
];

export const SAMPLE_PROFILE: Profile = {
  name: 'Reader',
  email: 'reader@email.com',
  phone: '',
  location: '',
  favGenre: 'Fiction',
  goal: '24',
  bio: '',
  since: '2023',
};

export const HOURS_READ = {
  today: '1h 12m',
  week: '6h 43m',
  month: '22h 0m',
  year: '184h 0m',
  all: '501h 40m',
};
