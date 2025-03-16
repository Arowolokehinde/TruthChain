// import React from 'react';
// import { useAppContext } from '../../contexts/AppContext';
// // import Navbar from '../layout/Navbar';
// import Footer from '../layout/Footer';
// import Home from '@/pages/Home';
// import Dashboard from '@/pages/Dashboard';
// import Login from '@/pages/Login';

// import VerifyContent from '@/pages/VerifyContent';
// import ContentDetails from '@/pages/ContentDetails';
// import SignUpPage from '@/pages/Signup';
// import Navbar from '../Navigation/Navbar';

// export const AppLayout: React.FC = () => {
//     const { currentPage } = useAppContext();

//     // For home page showing a different layout without dashboard elements
//     if (currentPage === 'home') {
//         return (
//             <div className="min-h-screen bg-transparent">
//                 <Navbar />
//                 <main>
//                     <Home />
//                 </main>
//                 <Footer />
//             </div>
//         );
//     }

//     // For login and signup pages
//     if (currentPage === 'login' || currentPage === 'signup') {
//         return (
//             <div className="min-h-screen bg-transparent">
//                 {currentPage === 'login' ? <Login /> : <SignUpPage />}
//             </div>
//         );
//     }

//     const renderPage = () => {
//         switch (currentPage) {
//             case 'dashboard':
//                 return <Dashboard />;
//             case 'verify':
//                 return <VerifyContent />;
//             case 'content':
//                 return <ContentDetails />;
//             default:
//                 return <Dashboard />;
//         }
//     };

//     // Default layout for authenticated pages
//     return (
//         <div className="min-h-screen bg-gray-900">
//             <Navbar />
//             <main className="pt-20">
//                 <div className="container mx-auto px-4 py-8">
//                     {renderPage()}
//                 </div>
//             </main>
//             <Footer />
//         </div>
//     );
// };

// export default AppLayout;