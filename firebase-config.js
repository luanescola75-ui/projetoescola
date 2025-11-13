




const firebaseConfig = {
  apiKey: "AIzaSyDOMJYymvjApHshn7TWe83KEpM-2eoC09A",
  authDomain: "escola-5db5c.firebaseapp.com",
  projectId: "escola-5db5c",
};
firebase.initializeApp(firebaseConfig)
const auth = firebase.auth();
const db = firebase.firestore();

const storage = firebase.storage();