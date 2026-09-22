/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
 const [darkMode, setDarkMode] = useState(false);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [servicesOpen, setServicesOpen] = useState(false);
 const [installOpen, setInstallOpen] = useState(false);
 const dialog = useRef<HTMLDialogElement>(null);
 useEffect(() => { const dark = localStorage.getItem("finova-theme") === "dark"; document.documentElement.classList.toggle("dark", dark); const timer = setTimeout(() => setDarkMode(dark), 0); return () => clearTimeout(timer); }, []);
 useEffect(() => { if (installOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [installOpen]);
 const toggleTheme = () => { const dark = !darkMode; setDarkMode(dark); localStorage.setItem("finova-theme", dark ? "dark" : "light"); document.documentElement.classList.toggle("dark", dark); };
 return <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"><a className="skip-link" href="#home">Skip to content</a>


    
    



    
    <nav className="relative bg-linear-to-r from-white via-primary-50 to-white dark:from-gray-900 dark:via-primary-900 dark:to-gray-900 backdrop-blur-xl border-b border-gradient-to-r from-transparent via-primary-200/50 to-transparent dark:border-primary-700/30 sticky top-0 z-50 shadow-lg shadow-primary-500/5">
        
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -top-5 right-1/4 w-16 h-16 bg-teal-200/20 dark:bg-teal-800/20 rounded-full blur-lg animate-pulse" style={{"animationDelay":"1s"}}></div>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-xl animate-pulse" style={{"animationDelay":"2s"}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 lg:h-18">
                
                <div className="flex items-center group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-400/20 rounded-xl blur-lg group-hover:bg-primary-400/30 transition-all duration-300"></div>
                        <img src="/finova-bank-logo-cropped.png" alt="Finova Bank" className="relative h-10 lg:h-10 w-auto" />
                    </div>
                </div>

                
                <div className="hidden lg:flex items-center space-x-1">
                    <Link href="/" className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 group">
                        <span className="relative z-10">Home</span>
                        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    </Link>
                    <a href="#about" className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 group">
                        <span className="relative z-10">About</span>
                        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    </a>
                    <div className="relative group">
                        <button className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center">
                            <span className="relative z-10">Services</span>
                            <i className="fa-solid fa-chevron-down ml-1 text-xs group-hover:rotate-180 transition-transform duration-300"></i>
                            <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                        </button>
                        
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-focus-within:opacity-100 group-hover:visible group-focus-within:visible transition-all duration-300 z-50">
                            <div className="p-2">
                                <a href="#rates" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300">
                                    <i className="fa-solid fa-user mr-3 text-primary-500"></i>
                                    Personal Banking
                                </a>
                                <a href="#services" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300">
                                    <i className="fa-solid fa-briefcase mr-3 text-blue-500"></i>
                                    Business Banking
                                </a>
                                <a href="/banking?mode=login" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300">
                                    <i className="fa-solid fa-handshake mr-3 text-green-500"></i>
                                    Loans & Credit
                                </a>
                                <a href="/banking?mode=login" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300">
                                    <i className="fa-solid fa-credit-card mr-3 text-purple-500"></i>
                                    Cards
                                </a>
                                <a href="#services" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300">
                                    <i className="fa-solid fa-hand-holding-dollar mr-3 text-orange-500"></i>
                                    Grants & Aid
                                </a>
                            </div>
                        </div>
                    </div>
                    <a href="#contact" className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 group">
                        <span className="relative z-10">Contact</span>
                        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                    </a>
                </div>

                
                <div className="hidden lg:flex items-center space-x-3">
                    

                    
                    <button onClick={toggleTheme} aria-label="Toggle color theme" 
                            className="relative p-3 rounded-2xl bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300 hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group">
                        <i className="fa-solid fa-sun text-lg group-hover:rotate-180 transition-transform duration-500" hidden={!(darkMode)}></i>
                        <i className="fa-solid fa-moon text-lg group-hover:rotate-12 transition-transform duration-300" hidden={!(!darkMode)}></i>
                    </button>
                    
                    
                    <a href="/banking?mode=login" className="relative px-4 py-2.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-all duration-300 group">
                        <span className="relative z-10">Login</span>
                        <div className="absolute inset-0 bg-linear-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    </a>
                    
                    
                    <a href="/banking?mode=register" className="relative px-6 py-2.5 bg-linear-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-700 hover:via-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/40 hover:-translate-y-0.5 group overflow-hidden">
                        <span className="relative z-10 flex items-center">
                            <i className="fa-solid fa-sparkles mr-2 group-hover:animate-spin"></i>
                            Open Account
                        </span>
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </a>
                </div>

                
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} className="lg:hidden relative p-3 rounded-2xl bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                    <i className="fa-solid fa-bars text-lg transition-transform duration-300" hidden={!(!mobileMenuOpen)}></i>
                    <i className="fa-solid fa-times text-lg transition-transform duration-300" hidden={!(mobileMenuOpen)}></i>
                </button>
            </div>
        </div>

        
        <div hidden={!(mobileMenuOpen)}
             className="lg:hidden absolute top-full left-0 right-0 bg-linear-to-br from-white via-primary-50 to-white dark:from-gray-900 dark:via-primary-900 dark:to-gray-900 backdrop-blur-xl border-t border-primary-200/70 dark:border-primary-700/50 shadow-2xl shadow-primary-500/20">
            
            
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-teal-200/20 dark:bg-teal-800/20 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative px-6 py-6 space-y-2">
                
                <Link href="/" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 rounded-2xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 hover:shadow-lg hover:translate-x-2 group">
                    <i className="fa-solid fa-home mr-4 text-primary-500 group-hover:scale-110 transition-transform duration-300"></i>
                    <span>Home</span>
                    <i className="fa-solid fa-chevron-right ml-auto text-xs opacity-0 group-hover:opacity-100 transition-all duration-300"></i>
                </Link>
                <a href="#about" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 rounded-2xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 hover:shadow-lg hover:translate-x-2 group">
                    <i className="fa-solid fa-info-circle mr-4 text-teal-500 group-hover:scale-110 transition-transform duration-300"></i>
                    <span>About</span>
                    <i className="fa-solid fa-chevron-right ml-auto text-xs opacity-0 group-hover:opacity-100 transition-all duration-300"></i>
                </a>
                
                
                <div className="space-y-2">
                    <button onClick={() => setServicesOpen(!servicesOpen)} aria-expanded={servicesOpen} className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 rounded-2xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 hover:shadow-lg hover:translate-x-2 group">
                        <i className="fa-solid fa-cogs mr-4 text-purple-500 group-hover:scale-110 transition-transform duration-300"></i>
                        <span>Services</span>
                        <i className="fa-solid fa-chevron-down ml-auto text-xs transition-transform duration-300"></i>
                    </button>
                    <div hidden={!(servicesOpen)} className="ml-8 space-y-1">
                        <a href="#rates" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-all duration-300 rounded-xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30">
                            <i className="fa-solid fa-user mr-3 text-primary-400"></i>
                            Personal Banking
                        </a>
                        <a href="#services" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-all duration-300 rounded-xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30">
                            <i className="fa-solid fa-briefcase mr-3 text-blue-400"></i>
                            Business Banking
                        </a>
                        <a href="/banking?mode=login" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-all duration-300 rounded-xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30">
                            <i className="fa-solid fa-handshake mr-3 text-green-400"></i>
                            Loans & Credit
                        </a>
                        <a href="/banking?mode=login" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-all duration-300 rounded-xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30">
                            <i className="fa-solid fa-credit-card mr-3 text-purple-400"></i>
                            Cards
                        </a>
                        <a href="#services" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-all duration-300 rounded-xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30">
                            <i className="fa-solid fa-hand-holding-dollar mr-3 text-orange-400"></i>
                            Grants & Aid
                        </a>
                    </div>
                </div>
                
                <a href="#contact" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 rounded-2xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 hover:shadow-lg hover:translate-x-2 group">
                    <i className="fa-solid fa-envelope mr-4 text-orange-500 group-hover:scale-110 transition-transform duration-300"></i>
                    <span>Contact</span>
                    <i className="fa-solid fa-chevron-right ml-auto text-xs opacity-0 group-hover:opacity-100 transition-all duration-300"></i>
                </a>
                
                
                <a href="#mobile-app" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 rounded-2xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 hover:shadow-lg hover:translate-x-2 group">
                    <i className="fa-solid fa-mobile-alt mr-4 text-indigo-500 group-hover:scale-110 transition-transform duration-300"></i>
                    <span>Mobile App</span>
                    <i className="fa-solid fa-chevron-right ml-auto text-xs opacity-0 group-hover:opacity-100 transition-all duration-300"></i>
                </a>
                
                
                <div className="pt-4 mt-4 border-t border-primary-700/50">
                    

                    <button onClick={toggleTheme} aria-label="Toggle color theme" 
                            className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 rounded-2xl hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 hover:shadow-lg hover:translate-x-2 group">
                        <div className="flex items-center justify-center w-8 h-8 mr-4 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 dark:from-blue-500 dark:to-purple-600 group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-sun text-white text-sm group-hover:rotate-180 transition-transform duration-500" hidden={!(darkMode)}></i>
                            <i className="fa-solid fa-moon text-white text-sm group-hover:rotate-12 transition-transform duration-300" hidden={!(!darkMode)}></i>
                        </div>
                        <span x-text="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"></span>
                        <i className="fa-solid fa-chevron-right ml-auto text-xs opacity-0 group-hover:opacity-100 transition-all duration-300"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    
<section id="home" className="relative h-screen min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden bg-primary-900">
    
    <div className="absolute inset-0">
        <img src="/sefton/metro.jpg" 
             alt="Modern banking experience" 
             className="w-full h-full object-cover object-[75%_25%] md:object-center"
             loading="eager"
             style={{"opacity":"1"}} />
        
        <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-primary-800 to-primary-900 lg:hidden"></div>
        
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/30 lg:from-black/70 lg:via-black/50 lg:to-transparent"></div>
    </div>
    
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center min-h-[400px] lg:min-h-[500px]">
            
            <div className="text-white w-full lg:w-1/2 text-center lg:text-left">
                
                <div className="lg:hidden flex justify-center mb-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <i className="fa-solid fa-university text-2xl text-white"></i>
                    </div>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 lg:mb-6">
                    Finova Bank
                </h1>
                
                
                <p className="lg:hidden text-primary-100 text-lg font-medium mb-6">Your Digital Banking Partner</p>
                <p className="lg:hidden">We do banking differently. We believe that people come first, and that everyone deserves a great experience every step of the way.</p>
                <br />
                
                
                <p className="hidden lg:block text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
                    We do banking differently. We believe that people come first, and that everyone deserves a great experience every step of the way.
                </p>
                
                
                
                
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-8 lg:mb-12">
                    <a href="/banking?mode=register" className="inline-flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl lg:rounded-2xl transition-all duration-300 shadow-2xl shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-1 hover:scale-105">
                        <i className="fa-solid fa-user-plus mr-2 lg:mr-3"></i>
                        Open Account Today
                    </a>
                    <a href="/banking?mode=login" className="inline-flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-xl lg:rounded-2xl transition-all duration-300 border border-white/30 hover:border-white/50 hover:-translate-y-1">
                        <i className="fa-solid fa-sign-in-alt mr-2 lg:mr-3"></i>
                        Login to Banking
                    </a>
                </div>
                
                
                <div className="lg:hidden grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                    <div className="text-center">
                        <p className="text-xl font-bold text-white">50K+</p>
                        <p className="text-xs text-primary-100">Happy Customers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-white">$2.5B+</p>
                        <p className="text-xs text-primary-100">Assets Managed</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    
    <div className="hidden lg:block absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-4 pb-8">
                
                <div className="bg-primary-600 hover:bg-primary-700 transition-all duration-300 rounded-2xl p-6 text-white shadow-2xl hover:shadow-primary-600/30 hover:-translate-y-2 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-primary-100 text-sm font-medium mb-1">ROUTING #</p>
                            <p className="text-2xl font-bold">251480576</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-university text-xl"></i>
                        </div>
                    </div>
                </div>
                
                
                <div className="bg-teal-500 hover:bg-teal-600 transition-all duration-300 rounded-2xl p-6 text-white shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-2 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-teal-100 text-sm font-medium mb-1">BRANCH HOURS</p>
                            <p className="text-lg font-bold">Mon-Fri: 9AM-5PM</p>
                            <p className="text-sm text-teal-100">Sat: 9AM-1PM</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-clock text-xl"></i>
                        </div>
                    </div>
                </div>
                
                
                <div className="bg-purple-600 hover:bg-purple-700 transition-all duration-300 rounded-2xl p-6 text-white shadow-2xl hover:shadow-purple-600/30 hover:-translate-y-2 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">24/7 SUPPORT</p>
                            <p className="text-lg font-bold">1-800-BANKING</p>
                            <p className="text-sm text-purple-100">Always here to help</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-phone text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce"></div>
        </div>
    </div>
</section>


<section id="rates" className="relative py-16 lg:py-20 bg-linear-to-br from-slate-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/20 overflow-hidden">
    
    <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 dark:bg-primary-800 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200 dark:bg-teal-800 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-linear-to-r from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold mb-4 shadow-lg backdrop-blur-sm border border-primary-200/50 dark:border-primary-700/50">
                <i className="fa-solid fa-chart-line mr-2 animate-pulse"></i>
                Finova Bank Rates
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-gray-900 via-primary-800 to-gray-900 dark:from-white dark:via-primary-300 dark:to-white bg-clip-text text-transparent mb-4">
                Finova Bank Member Care
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover competitive rates designed to help your money grow faster
            </p>
        </div>

        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300/50 dark:hover:border-primary-600/50 overflow-hidden">
                
                <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                        <i className="fa-solid fa-piggy-bank text-xl text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">3.75%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">APY*</div>
                        <div className="font-bold text-gray-900 dark:text-white mb-2 text-sm">HIGH YIELD SAVINGS</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">High Yield Savings Rate</div>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-3 py-1.5 bg-linear-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold shadow-sm">
                            <i className="fa-solid fa-star mr-1 animate-pulse"></i>
                            FEATURED
                        </span>
                    </div>
                </div>
            </div>

            
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-300/50 dark:hover:border-teal-600/50 overflow-hidden">
                
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 bg-linear-to-br from-teal-100 to-teal-200 dark:from-teal-900/50 dark:to-teal-800/50 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                        <i className="fa-solid fa-certificate text-xl text-teal-600 dark:text-teal-400"></i>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-teal-600 to-green-600 dark:from-teal-400 dark:to-green-400 bg-clip-text text-transparent mb-2">3.65%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">APY*</div>
                        <div className="font-bold text-gray-900 dark:text-white mb-2 text-sm">18 MONTH CERTIFICATE</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Finova Bank Certificate Rates</div>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-3 py-1.5 bg-linear-to-r from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 text-teal-700 dark:text-teal-400 rounded-full text-xs font-bold shadow-sm">
                            <i className="fa-solid fa-coins mr-1"></i>
                            SAVINGS
                        </span>
                    </div>
                </div>
            </div>

            
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-600/50 overflow-hidden">
                
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                        <i className="fa-solid fa-credit-card text-xl text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">4.00%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">APR*</div>
                        <div className="font-bold text-gray-900 dark:text-white mb-2 text-sm">CREDIT CARDS</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Finova Bank Credit Card Rates</div>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-3 py-1.5 bg-linear-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold shadow-sm">
                            <i className="fa-solid fa-credit-card mr-1"></i>
                            CREDIT
                        </span>
                    </div>
                </div>
            </div>

            
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-300/50 dark:hover:border-orange-600/50 overflow-hidden">
                
                <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                        <i className="fa-solid fa-hand-holding-dollar text-xl text-orange-600 dark:text-orange-400"></i>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent mb-2">15.49%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">APR*</div>
                        <div className="font-bold text-gray-900 dark:text-white mb-2 text-sm">LOANS</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Finova Bank Standard Loan Rates</div>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-3 py-1.5 bg-linear-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold shadow-sm">
                            <i className="fa-solid fa-percentage mr-1"></i>
                            MORTGAGE
                        </span>
                    </div>
                </div>
            </div>
        </div>

        
        <div className="text-center mt-8 lg:mt-12">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <i className="fa-solid fa-info-circle text-primary-600 dark:text-primary-400 mr-2"></i>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    *Annual Percentage Yield. Rates subject to change. Terms and conditions apply.
                </p>
            </div>
        </div>
    </div>
</section>


<section id="services" className="relative py-16 lg:py-20 bg-linear-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 overflow-hidden">
    
    <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float-delayed"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-4 border border-white/20">
                <i className="fa-solid fa-concierge-bell mr-2 animate-pulse"></i>
                Our Services
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                How Can We Help You Today?
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                Comprehensive banking solutions tailored to your needs
            </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10">
                <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-white/20 to-white/10 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-white/30">
                    <i className="fa-solid fa-university text-2xl text-white group-hover:text-primary-100"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 transition-colors">Deposit Accounts</h3>
                <p className="text-primary-100 leading-relaxed group-hover:text-white/90 transition-colors">Secure your money with our high-yield savings and checking accounts designed for growth.</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
            </div>

            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10">
                <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-white/20 to-white/10 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-white/30">
                    <i className="fa-solid fa-credit-card text-2xl text-white group-hover:text-primary-100"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 transition-colors">Credit Cards</h3>
                <p className="text-primary-100 leading-relaxed group-hover:text-white/90 transition-colors">Find the perfect credit card for your lifestyle and spending habits with competitive rates.</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
            </div>

            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10">
                <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-white/20 to-white/10 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-white/30">
                    <i className="fa-solid fa-home text-2xl text-white group-hover:text-primary-100"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 transition-colors">Loans</h3>
                <p className="text-primary-100 leading-relaxed group-hover:text-white/90 transition-colors">Get competitive rates on personal, auto, and home loans tailored to your financial goals.</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
            </div>

            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10">
                <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-white/20 to-white/10 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-white/30">
                    <i className="fa-solid fa-briefcase text-2xl text-white group-hover:text-primary-100"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 transition-colors">Business Banking</h3>
                <p className="text-primary-100 leading-relaxed group-hover:text-white/90 transition-colors">Comprehensive banking solutions designed to help your business thrive and grow.</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
            </div>

            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10">
                <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-white/20 to-white/10 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-white/30">
                    <i className="fa-solid fa-chart-pie text-2xl text-white group-hover:text-primary-100"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 transition-colors">Wealth & Retire</h3>
                <p className="text-primary-100 leading-relaxed group-hover:text-white/90 transition-colors">Plan for your future with our expert investment and retirement planning services.</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
            </div>

            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10">
                <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-white/20 to-white/10 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-white/30">
                    <i className="fa-solid fa-info-circle text-2xl text-white group-hover:text-primary-100"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-100 transition-colors">About Finova Bank</h3>
                <p className="text-primary-100 leading-relaxed group-hover:text-white/90 transition-colors">Learn more about our commitment to exceptional banking services and community support.</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
            </div>
        </div>
    </div>
</section>


<section id="about" className="relative py-16 lg:py-20 bg-linear-to-br from-white via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20 overflow-hidden">
    
    <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-10 w-64 h-64 bg-green-200 dark:bg-green-800 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary-200 dark:bg-primary-800 rounded-full blur-3xl animate-pulse delay-500"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="order-2 lg:order-1">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-linear-to-r from-green-500/20 to-primary-500/20 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative rounded-3xl aspect-[4/3] overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500 border border-white/20 dark:border-gray-700/50">
                        <img src="/sefton/feature.jpg" 
                             alt="Happy family with financial security" 
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                </div>
            </div>

            
            <div className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-linear-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-700 dark:text-green-300 rounded-full text-sm font-bold mb-6 shadow-lg backdrop-blur-sm border border-green-200/50 dark:border-green-700/50">
                    <i className="fa-solid fa-dollar-sign mr-2 animate-pulse"></i>
                    Get $200* With a Checking Account Built for You
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-gray-900 via-green-700 to-gray-900 dark:from-white dark:via-green-300 dark:to-white bg-clip-text text-transparent leading-tight">
                    Start Building Your Financial Strength
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    For a limited time, get a $200 when you open any new account, and what helps you reach your financial goals. You can open a new account online or in person at any of our locations.
                </p>
                
                
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-green-600 dark:text-green-400 text-sm"></i>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">No minimum balance required</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-green-600 dark:text-green-400 text-sm"></i>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Free online and mobile banking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-green-600 dark:text-green-400 text-sm"></i>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">24/7 customer support</span>
                    </div>
                </div>
                
                <a href="/banking?mode=register" className="inline-flex items-center px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-primary-500/25 hover:-translate-y-1 hover:scale-105 group">
                    <i className="fa-solid fa-arrow-right mr-3 group-hover:translate-x-1 transition-transform"></i>
                    Open Account Now
                </a>
            </div>
        </div>
    </div>
</section>


<section id="community" className="relative py-16 lg:py-20 bg-linear-to-br from-slate-50 via-primary-50 to-teal-50 dark:from-gray-800 dark:via-primary-900/20 dark:to-teal-900/20 overflow-hidden">
    
    <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-200 dark:bg-teal-800 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-200 dark:bg-primary-800 rounded-full blur-3xl animate-float-delayed"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-linear-to-r from-primary-100 to-teal-100 dark:from-primary-900/50 dark:to-teal-900/50 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-4 shadow-lg backdrop-blur-sm border border-primary-200/50 dark:border-primary-700/50">
                    <i className="fa-solid fa-handshake mr-2 animate-pulse"></i>
                    Member-Focused Banking
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-gray-900 via-primary-700 to-teal-700 dark:from-white dark:via-primary-300 dark:to-teal-300 bg-clip-text text-transparent leading-tight">
                    Building Strength Together
                </h2>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    Finova Bank is a full-service bank built to support you through every step of your financial journey. We&apos;re committed to helping you achieve your financial goals through personalized service and competitive rates.
                </p>
                
                <div className="space-y-4">
                    <div className="group flex items-start space-x-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-chart-line text-primary-600 dark:text-primary-400"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Competitive Rates</h4>
                            <p className="text-gray-600 dark:text-gray-300">Better rates on savings, loans, and credit cards designed to maximize your financial growth.</p>
                        </div>
                    </div>
                    
                    <div className="group flex items-start space-x-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-linear-to-br from-teal-100 to-teal-200 dark:from-teal-900/50 dark:to-teal-800/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-users text-teal-600 dark:text-teal-400"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Member-Focused</h4>
                            <p className="text-gray-600 dark:text-gray-300">We&apos;re owned by our members, not shareholders. Your success is our priority.</p>
                        </div>
                    </div>
                    
                    <div className="group flex items-start space-x-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-heart text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Community Committed</h4>
                            <p className="text-gray-600 dark:text-gray-300">Supporting local communities and causes that matter to our members.</p>
                        </div>
                    </div>
                </div>
            </div>

            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="group relative rounded-2xl aspect-square overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                        <div className="absolute -inset-1 bg-linear-to-r from-primary-500/20 to-teal-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative rounded-2xl overflow-hidden">
                            <img src="/sefton/photo-1554224155-6726b3ff858f.jpg" 
                                 alt="Team collaboration in banking" 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                    </div>
                    <div className="group relative rounded-2xl aspect-[4/3] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                        <div className="absolute -inset-1 bg-linear-to-r from-teal-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative rounded-2xl overflow-hidden">
                            <img src="/sefton/photo-1507003211169-0a1dd7228f2d.jpg" 
                                 alt="Professional banking consultant" 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4 pt-8">
                    <div className="group relative rounded-2xl aspect-[4/3] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                        <div className="absolute -inset-1 bg-linear-to-r from-purple-500/20 to-primary-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative rounded-2xl overflow-hidden">
                            <img src="/sefton/photo-1551836022-deb4988cc6c0.jpg" 
                                 alt="Modern banking technology" 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                    </div>
                    <div className="group relative rounded-2xl aspect-square overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                        <div className="absolute -inset-1 bg-linear-to-r from-primary-500/20 to-teal-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative rounded-2xl overflow-hidden">
                            <img src="/sefton/photo-1559526324-4b87b5e36e44.jpg" 
                                 alt="Community banking support" 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>


<section id="mobile-app" className="relative py-16 lg:py-20 bg-linear-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 overflow-hidden">
    
    <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float-delayed"></div>
        
        <div className="absolute top-10 right-1/4 w-8 h-8 bg-white/20 rounded-xl rotate-12 animate-bounce" style={{"animationDelay":"0.5s"}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-white/15 rounded-lg rotate-45 animate-bounce" style={{"animationDelay":"1.5s"}}></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white/10 rounded-full animate-bounce" style={{"animationDelay":"2.5s"}}></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="text-center lg:text-left text-white">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                    <i className="fa-solid fa-mobile-alt mr-2 animate-pulse"></i>
                    Get Our Mobile App
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Banking Made Simple with the Finova Bank App
                </h2>
                
                <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                    Experience the future of mobile banking with our Progressive Web App. Get native app performance with the convenience of web technology - no app store required!
                </p>
                
                
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                            <i className="fa-solid fa-wifi text-green-400"></i>
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-white text-sm">Works Offline</h4>
                            <p className="text-primary-100 text-xs">Access your account anywhere</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                            <i className="fa-solid fa-rocket text-blue-400"></i>
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-white text-sm">Lightning Fast</h4>
                            <p className="text-primary-100 text-xs">Instant loading & responses</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                            <i className="fa-solid fa-bell text-purple-400"></i>
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-white text-sm">Push Notifications</h4>
                            <p className="text-primary-100 text-xs">Stay updated on transactions</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                            <i className="fa-solid fa-shield-alt text-orange-400"></i>
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-white text-sm">Bank-Level Security</h4>
                            <p className="text-primary-100 text-xs">Your data is always protected</p>
                        </div>
                    </div>
                </div>
                
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <button id="installPWA" onClick={() => setInstallOpen(true)} className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-primary-700 font-bold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:-translate-y-1 hover:scale-105 transform">
                        <i className="fa-solid fa-download mr-3 text-lg"></i>
                        Install Finova Bank App
                    </button>
                    
                    <a href="/banking?mode=login" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 border border-white/30 hover:border-white/50 hover:-translate-y-1">
                        <i className="fa-solid fa-sign-in-alt mr-3"></i>
                        Open Web Banking
                    </a>
                </div>
                
                
                <div className="text-center lg:text-left">
                    <p className="text-primary-100 text-sm mb-3">Compatible with all modern browsers:</p>
                    <div className="flex justify-center lg:justify-start space-x-6">
                        <div className="flex items-center">
                            <i className="fab fa-chrome text-2xl text-white/80 mr-2"></i>
                            <span className="text-white/80 text-sm">Chrome</span>
                        </div>
                        <div className="flex items-center">
                            <i className="fab fa-firefox text-2xl text-white/80 mr-2"></i>
                            <span className="text-white/80 text-sm">Firefox</span>
                        </div>
                        <div className="flex items-center">
                            <i className="fab fa-safari text-2xl text-white/80 mr-2"></i>
                            <span className="text-white/80 text-sm">Safari</span>
                        </div>
                        <div className="flex items-center">
                            <i className="fab fa-edge text-2xl text-white/80 mr-2"></i>
                            <span className="text-white/80 text-sm">Edge</span>
                        </div>
                    </div>
                </div>
            </div>
            
            
            <div className="relative flex justify-center lg:justify-end">
                
                <div className="relative w-80 h-[600px] bg-linear-to-br from-gray-900 to-gray-800 rounded-[3rem] p-4 shadow-2xl">
                    
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden shadow-inner relative">
                        
                        <div className="bg-primary-600 h-12 flex items-center justify-between px-6 text-white text-sm">
                            <div className="flex items-center space-x-1">
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <span className="ml-2 font-medium">Finova Bank</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <i className="fa-solid fa-wifi text-xs"></i>
                                <i className="fa-solid fa-battery-full text-xs"></i>
                                <span className="text-xs">100%</span>
                            </div>
                        </div>
                        
                        
                        <div className="p-6 bg-linear-to-br from-primary-50 to-white h-full">
                            
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-university text-2xl text-primary-600"></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome Back!</h3>
                                <p className="text-gray-600 text-sm">Your banking at your fingertips</p>
                            </div>
                            
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                                        <i className="fa-solid fa-paper-plane text-green-600 text-sm"></i>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-xs">Transfer</h4>
                                    <p className="text-gray-500 text-xs">Send money</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                                        <i className="fa-solid fa-credit-card text-blue-600 text-sm"></i>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-xs">Pay Bills</h4>
                                    <p className="text-gray-500 text-xs">Quick payments</p>
                                </div>
                            </div>
                            
                            
                            <div className="bg-linear-to-r from-primary-600 to-primary-700 rounded-2xl p-4 text-white">
                                <p className="text-primary-100 text-xs mb-1">Available Balance</p>
                                <h3 className="text-2xl font-bold mb-2">$12,847.50</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-primary-100 text-xs">****1234</span>
                                    <i className="fa-solid fa-eye text-primary-200"></i>
                                </div>
                            </div>
                            
                            
                            <div className="mt-6 bg-linear-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white text-center animate-pulse">
                                <i className="fa-solid fa-download text-xl mb-2"></i>
                                <p className="text-sm font-semibold">Install for offline access</p>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
                </div>
                
                
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-float">
                    <i className="fa-solid fa-shield-alt text-white text-lg"></i>
                </div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center animate-float" style={{"animationDelay":"1s"}}>
                    <i className="fa-solid fa-bolt text-white text-xl"></i>
                </div>
            </div>
        </div>
    </div>
</section>


<section id="testimonials" className="py-12 lg:py-16 bg-white dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">Hear From Our Customers</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                    <div className="flex space-x-1">
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic text-sm">
                    &ldquo;I am impressed with the customer service and speed of payout.&rdquo;
                </p>
                <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-3">
                        <i className="fa-solid fa-user text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">Sarah Morris</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Verified Customer</div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                    <div className="flex space-x-1">
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic text-sm">
                    &ldquo;Excellent service and competitive rates. Highly recommended!&rdquo;
                </p>
                <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-3">
                        <i className="fa-solid fa-user text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">John Davis</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Business Owner</div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                    <div className="flex space-x-1">
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <i className="fa-solid fa-star text-yellow-400"></i>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic text-sm">
                    &ldquo;The mobile app is fantastic and customer support is top-notch.&rdquo;
                </p>
                <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-3">
                        <i className="fa-solid fa-user text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">Emily Johnson</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Personal Banking</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>


<section id="contact" className="py-12 lg:py-16 bg-primary-50 dark:bg-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-6">
            
            <div className="text-center lg:text-left">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-3">
                    <i className="fa-solid fa-clock text-lg text-primary-600 dark:text-primary-400"></i>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Banking Hours</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                    Mon-Fri: 9AM-5PM<br />
                    Sat: 9AM-1PM<br />
                    Sun: Closed
                </p>
            </div>

            <div className="text-center lg:text-left">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-3">
                    <i className="fa-solid fa-phone text-lg text-primary-600 dark:text-primary-400"></i>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Phone Banking</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                    Available 24/7<br />
                    Call: 44-7470-BANKING<br />
                    International: +1-555-0123
                </p>
            </div>

            <div className="text-center lg:text-left">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-3">
                    <i className="fa-solid fa-envelope text-lg text-primary-600 dark:text-primary-400"></i>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Contact Support</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                    Response within 24 hours<br />
                    Available in your Finova Bank account
                </p>
            </div>

            <div className="text-center lg:text-left">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-3">
                    <i className="fa-solid fa-map-marker-alt text-lg text-primary-600 dark:text-primary-400"></i>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Visit Us</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                    Ranelagh Street<br />
                    Liverpool L1 1JT<br />
                </p>
            </div>
        </div>
    </div>
</section>

    
    
    <footer className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 dark:from-gray-900 dark:via-primary-900 dark:to-gray-900 text-white py-16 mb-20 lg:mb-0 overflow-hidden">
        
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -right-20 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl animate-pulse" style={{"animationDelay":"1s"}}></div>
            <div className="absolute -bottom-20 left-1/3 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{"animationDelay":"2s"}}></div>
            
            
            <div className="absolute top-10 right-1/4 w-4 h-4 bg-white/10 rotate-45 animate-bounce" style={{"animationDelay":"0.5s"}}></div>
            <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-primary-300/30 rounded-full animate-bounce" style={{"animationDelay":"1.5s"}}></div>
            <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-teal-400/40 rotate-45 animate-bounce" style={{"animationDelay":"2.5s"}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                
                <div className="lg:col-span-1">
                    <div className="group mb-6">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:bg-white/30 transition-all duration-300"></div>
                            <img src="/finova-bank-logo-cropped.png" alt="Finova Bank" className="relative h-10 w-auto" />
                        </div>
                    </div>
                    <p className="text-primary-100 mb-6 text-sm leading-relaxed">
                        Building financial strength together with personalized banking solutions for every member. Your trusted partner in financial growth.
                    </p>
                    
                    
                    <div className="flex space-x-3">
                        <a href="#" className="group relative w-10 h-10 bg-linear-to-br from-primary-600 to-primary-700 hover:from-blue-600 hover:to-blue-700 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl">
                            <i className="fa-brands fa-facebook-f text-sm group-hover:scale-110 transition-transform duration-300"></i>
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </a>
                        <a href="#" className="group relative w-10 h-10 bg-linear-to-br from-primary-600 to-primary-700 hover:from-sky-500 hover:to-sky-600 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl">
                            <i className="fa-brands fa-twitter text-sm group-hover:scale-110 transition-transform duration-300"></i>
                            <div className="absolute inset-0 bg-linear-to-br from-sky-400 to-sky-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </a>
                        <a href="#" className="group relative w-10 h-10 bg-linear-to-br from-primary-600 to-primary-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl">
                            <i className="fa-brands fa-linkedin-in text-sm group-hover:scale-110 transition-transform duration-300"></i>
                            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </a>
                        <a href="#" className="group relative w-10 h-10 bg-linear-to-br from-primary-600 to-primary-700 hover:from-pink-600 hover:to-pink-700 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl">
                            <i className="fa-brands fa-instagram text-sm group-hover:scale-110 transition-transform duration-300"></i>
                            <div className="absolute inset-0 bg-linear-to-br from-pink-500 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </a>
                    </div>
                </div>

                
                <div>
                    <h4 className="font-bold mb-6 text-white flex items-center">
                        <div className="w-1 h-6 bg-linear-to-b from-primary-400 to-primary-600 rounded-full mr-3"></div>
                        Quick Links
                    </h4>
                    <ul className="space-y-3">
                        <li><a href="#about" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-primary-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">About Us</span>
                        </a></li>
                        <li><a href="#rates" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-primary-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Services</span>
                        </a></li>
                        <li><a href="#services" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-primary-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Grants & Aid</span>
                        </a></li>
                        <li><a href="#contact" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-primary-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Contact</span>
                        </a></li>
                    </ul>
                </div>

                
                <div>
                    <h4 className="font-bold mb-6 text-white flex items-center">
                        <div className="w-1 h-6 bg-linear-to-b from-teal-400 to-teal-600 rounded-full mr-3"></div>
                        Services
                    </h4>
                    <ul className="space-y-3">
                        <li><a href="#rates" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-teal-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Personal Banking</span>
                        </a></li>
                        <li><a href="#services" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-teal-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Business Banking</span>
                        </a></li>
                        <li><a href="/banking?mode=login" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-teal-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Loans & Credit</span>
                        </a></li>
                        <li><a href="/banking?mode=login" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-teal-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Cards</span>
                        </a></li>
                    </ul>
                </div>

                
                <div>
                    <h4 className="font-bold mb-6 text-white flex items-center">
                        <div className="w-1 h-6 bg-linear-to-b from-purple-400 to-purple-600 rounded-full mr-3"></div>
                        Member Services
                    </h4>
                    <ul className="space-y-3">
                        <li><a href="/banking?mode=login" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-purple-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Online Banking</span>
                        </a></li>
                        <li><a href="#mobile-app" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-purple-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Mobile App</span>
                        </a></li>
                        <li><a href="#contact" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-purple-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">ATM Locations</span>
                        </a></li>
                        <li><a href="#services" className="group flex items-center text-primary-100 hover:text-white transition-all duration-300 text-sm">
                            <i className="fa-solid fa-chevron-right text-xs mr-3 text-purple-400 group-hover:translate-x-1 transition-transform duration-300"></i>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">Security Center</span>
                        </a></li>
                    </ul>
                </div>
            </div>

            
            <div className="border-t border-primary-700/50 pt-8">
                <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                        <p className="text-primary-100 text-sm">
                            © 2026 Finova Bank. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-2 text-primary-200 text-xs">
                            <i className="fa-solid fa-shield-alt text-green-400"></i>
                            <span className="text-primary-400">•</span>
                            <i className="fa-solid fa-lock text-blue-400"></i>
                            <span>256-bit SSL</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center lg:justify-end space-x-6">
                        <a href="https://iwebbtech.com.ng/sefton/privacy" className="text-primary-100 hover:text-white text-sm transition-colors duration-300 hover:underline">Privacy Policy</a>
                        <a href="https://iwebbtech.com.ng/sefton/terms-of-service" className="text-primary-100 hover:text-white text-sm transition-colors duration-300 hover:underline">Terms of Service</a>
                        <a href="#contact" className="text-primary-100 hover:text-white text-sm transition-colors duration-300 hover:underline">Accessibility</a>
                        <Link href="/" className="text-primary-100 hover:text-white text-sm transition-colors duration-300 hover:underline">Sitemap</Link>
                    </div>
                </div>
            </div>
                 </div>
     </footer>

     
    <div className="mobile-fixed-buttons">
        <a href="/banking?mode=login" className="flex-1 px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl text-primary-600 dark:text-primary-400 font-semibold shadow-lg border border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors text-center">
            <i className="fa-solid fa-sign-in-alt mr-2"></i>
            Login
        </a>
        <a href="/banking?mode=register" className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg transition-colors text-center">
            <i className="fa-solid fa-user-plus mr-2"></i>
            Register
        </a>
    </div>
     
     
 <dialog ref={dialog} onCancel={() => setInstallOpen(false)} className="install-dialog bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl p-8 shadow-2xl">
 <h2 className="text-2xl font-bold mb-4">Banking on your home screen</h2><p className="mb-4">To save this website on your phone, open your browser menu and choose <strong>Add to Home Screen</strong>. In Safari, use the Share menu.</p><p className="text-sm mb-6 text-gray-500 dark:text-gray-300">This shortcut opens the website. Banking features require an internet connection.</p><button autoFocus onClick={() => setInstallOpen(false)} className="px-6 py-3 bg-primary-600 text-white rounded-xl">Got it</button></dialog>
 </div>;
}
