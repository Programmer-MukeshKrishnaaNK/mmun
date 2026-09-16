import type { GuideSection } from "@/types";

// Built-in, general Model UN guidance. Deliberately avoids MMUN-specific facts
// (times, venues, contacts) — those come from Firestore. Organizers can replace
// this entirely by populating the `guide_sections` collection.
export const DEFAULT_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "how-it-works",
    title: "How MMUN works",
    icon: "landmark",
    order: 1,
    items: [
      {
        id: "how-1",
        title: "What is a Model UN?",
        body: "Delegates represent assigned countries or portfolios in simulated committees. You research your position, debate an agenda, negotiate with other delegates and work toward a resolution that committee votes on.",
      },
      {
        id: "how-2",
        title: "How the conference is organised",
        body: "The Secretariat runs the conference. Each committee is moderated by an Executive Board (Chair, Vice-Chair and Rapporteur) who manage debate, recognise speakers and rule on procedure.",
      },
      {
        id: "how-3",
        title: "Using this portal",
        body: "Home shows what is happening right now. Planner has the full schedule with what's on now and next. Help sends a question straight to the organizers. Announcements and documents update live — no need to refresh.",
      },
    ],
  },
  {
    id: "committee-basics",
    title: "Committee basics",
    icon: "users",
    order: 2,
    items: [
      {
        id: "cb-1",
        title: "Roll call",
        body: "At the start of each session the Chair calls each delegation. Answer “Present” or “Present and voting”. Present and voting means you cannot abstain on substantive votes.",
      },
      {
        id: "cb-2",
        title: "Speakers list",
        body: "The General Speakers’ List (GSL) is the default mode of debate. Raise your placard when the Chair asks for speakers. Unused time can be yielded to the Chair, to questions, or to another delegate.",
      },
      {
        id: "cb-3",
        title: "Caucuses",
        body: "A moderated caucus focuses debate on a sub-topic with short speeches. An unmoderated caucus suspends formal debate so delegates can move around, negotiate and draft.",
      },
    ],
  },
  {
    id: "during-session",
    title: "During a session",
    icon: "scroll",
    order: 3,
    items: [
      {
        id: "ds-1",
        title: "Etiquette",
        body: "Address the committee in the third person, stay in character as your delegation, and speak only when recognised by the Chair. Keep devices silent unless your committee allows them.",
      },
      {
        id: "ds-2",
        title: "Chits and notes",
        body: "Pass written notes through the committee’s designated process. Keep them relevant to the proceedings.",
      },
      {
        id: "ds-3",
        title: "Drafting a resolution",
        body: "Working papers become draft resolutions once they meet the committee’s sponsor and signatory requirements and are approved by the Executive Board. Amendments are introduced and voted on before the final vote.",
      },
    ],
  },
  {
    id: "procedure",
    title: "Rules & procedure",
    icon: "gavel",
    order: 4,
    items: [
      {
        id: "rp-1",
        title: "Points",
        body: "Point of Personal Privilege: a personal discomfort (e.g. can’t hear). Point of Order: an error in procedure. Point of Parliamentary Inquiry: a question about the rules. Point of Information: a question to a speaker, when allowed.",
      },
      {
        id: "rp-2",
        title: "Common motions",
        body: "Motion to open/close the speakers list, motion for a moderated or unmoderated caucus (state total time, speaking time and topic), motion to introduce a draft resolution, and motion to move into voting procedure.",
      },
      {
        id: "rp-3",
        title: "Voting",
        body: "Procedural votes require every delegation present to vote. On substantive votes delegations may vote for, against, or abstain (unless present and voting). Your committee’s Rules of Procedure document is the final authority.",
      },
    ],
  },
  {
    id: "faq",
    title: "Frequently asked questions",
    icon: "help",
    order: 5,
    items: [
      {
        id: "faq-1",
        title: "My committee or assignment looks wrong",
        body: "Open your profile from the avatar in the header to check your details, then send a request from the Help tab so organizers can confirm.",
      },
      {
        id: "faq-2",
        title: "Where do I find the schedule and venue?",
        body: "The Planner tab lists every event with its time and location, and highlights what’s on now and next.",
      },
      {
        id: "faq-3",
        title: "I can’t sign in",
        body: "Use the email address registered for MMUN. If it still doesn’t work, speak to the registration or Secretariat desk.",
      },
    ],
  },
];
