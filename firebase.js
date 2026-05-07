window.PromptPlayFirebase = (function () {
    let auth = null;
    let app = null;
    let database = null;

    function sendMessageSafe(objectName, methodName, message) {
        if (window.unityInstance) {
            window.unityInstance.SendMessage(objectName, methodName, message);
        } else {
            console.error("window.unityInstance is not available.");
        }
    }

    function initFirebase() {
        try {
            if (!firebase.apps.length) {
                const firebaseConfig = {
                    apiKey: "AIzaSyAjiCrcC77R_vVMHT0jBR34Fm1Nw8WpBGU",
                    authDomain: "promptplayapp.firebaseapp.com",
                    databaseURL: "https://promptplayapp-default-rtdb.firebaseio.com/",
                    projectId: "promptplayapp",
                    storageBucket: "promptplayapp.firebasestorage.app",
                    messagingSenderId: "614228935219",
                    appId: "1:614228935219:web:997b92dc6fcc30a2621946",
                    measurementId: "G-2KYHE0D91S"
                };

                app = firebase.initializeApp(firebaseConfig);
                console.log("Firebase initialized.");
            } else {
                app = firebase.app();
                console.log("Firebase already initialized.");
            }

            auth = firebase.auth();
            database = firebase.database();

            console.log("Firebase auth and database ready.");
        } catch (error) {
            console.error("Firebase init error:", error);
        }
    }

    function ensureAuthReady() {
        if (!auth) {
            console.error("Firebase auth is not initialized.");
            return false;
        }
        return true;
    }

    function ensureDatabaseReady() {
        if (!database) {
            console.error("Firebase database is not initialized.");
            return false;
        }

        if (!auth || !auth.currentUser) {
            console.error("No Firebase user is currently signed in.");
            return false;
        }

        return true;
    }

    function signIn(email, password) {
        if (!ensureAuthReady()) {
            sendMessageSafe("WebSignInManager", "OnFirebaseSignInFailed", "Firebase is not initialized.");
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const uid = userCredential.user.uid;

                sendMessageSafe(
                    "WebSignInManager",
                    "OnFirebaseSignInSuccess",
                    uid
                );
            })
            .catch((error) => {
                console.error("Sign-in error:", error);
                sendMessageSafe(
                    "WebSignInManager",
                    "OnFirebaseSignInFailed",
                    error.message
                );
            });
    }

    function signUp(email, password, username) {
        if (!ensureAuthReady()) {
            sendMessageSafe("WebSignUpManager", "OnFirebaseSignUpFailed", "Firebase is not initialized.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                return user.updateProfile({
                    displayName: username
                }).then(() => {
                    createDefaultProgressForUser(user.uid);

                    sendMessageSafe(
                        "WebSignUpManager",
                        "OnFirebaseSignUpSuccess",
                        user.uid + "|" + username
                    );
                });
            })
            .catch((error) => {
                console.error("Sign-up error:", error);
                sendMessageSafe(
                    "WebSignUpManager",
                    "OnFirebaseSignUpFailed",
                    error.message
                );
            });
    }

    function resetPassword(email) {
        if (!ensureAuthReady()) {
            sendMessageSafe("WebSignInManager", "OnFirebasePasswordResetFailed", "Firebase is not initialized.");
            return;
        }

        auth.sendPasswordResetEmail(email)
            .then(() => {
                sendMessageSafe(
                    "WebSignInManager",
                    "OnFirebasePasswordResetSent",
                    "sent"
                );
            })
            .catch((error) => {
                console.error("Password reset error:", error);
                sendMessageSafe(
                    "WebSignInManager",
                    "OnFirebasePasswordResetFailed",
                    error.message
                );
            });
    }

    function createDefaultProgressForUser(uid) {
        if (!database) {
            console.error("Cannot create default progress. Database is not ready.");
            return;
        }

        const defaultProgress = {
            moduleFlags: {
                foundationsOfAI: "Completed",
                aiPrompting: "NotStarted",
                practiceArena: "Locked"
            },
            modules: {
                aiPrompting: {
                    lessons: {
                        WhatIsPrompting: "NotStarted",
                        AnatomyOfAGoodPrompt: "Locked",
                        TextBasedPrompting: "Locked",
                        ImageBasedPrompting: "Locked",
                        AIEthics: "Locked"
                    }
                }
            }
        };

        database.ref("users/" + uid + "/progress").set(defaultProgress)
            .then(() => {
                console.log("Default progress created for user:", uid);
            })
            .catch((error) => {
                console.error("Create default progress error:", error);
            });
    }

    function saveLessonStatus(moduleName, lessonKey, status) {
        if (!ensureDatabaseReady()) {
            return;
        }

        const uid = auth.currentUser.uid;

        database
            .ref("users/" + uid + "/progress/modules/" + moduleName + "/lessons/" + lessonKey)
            .set(status)
            .then(() => {
                console.log("Saved lesson status:", moduleName, lessonKey, status);
            })
            .catch((error) => {
                console.error("Save lesson status error:", error);
            });
    }

    function saveModuleFlag(flagName, value) {
        if (!ensureDatabaseReady()) {
            return;
        }

        const uid = auth.currentUser.uid;

        database
            .ref("users/" + uid + "/progress/moduleFlags/" + flagName)
            .set(value)
            .then(() => {
                console.log("Saved module flag:", flagName, value);
            })
            .catch((error) => {
                console.error("Save module flag error:", error);
            });
    }

    return {
        initFirebase,
        signIn,
        signUp,
        resetPassword,
        saveLessonStatus,
        saveModuleFlag
    };
})();
