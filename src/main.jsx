import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { RootLayout } from './components'
import { RootProvider } from './context/RootContext'
import PrivacyPage from './pages/PrivacyPage.jsx'
import UITestPage from './pages/UITestPage.jsx'
import './index.css'

// 视频模块懒加载
const VideoApp = lazy(() => import('./video/VideoApp.jsx'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootProvider>
      <BrowserRouter>
        <RootLayout>
          <Routes>
            {/* 视频模块 */}
            <Route path="/video/*" element={
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-zinc-500">Loading Video Editor...</div>}>
                <VideoApp />
              </Suspense>
            } />

            {/* 首页：原来的 App 组件 */}
            <Route path="/" element={<App />} />
            <Route path="/explore" element={<App />} />

            {/* 设置页面：由 App 组件内部处理 */}
            <Route path="/setting" element={<App />} />

            {/* UI 测试页（仅开发用） */}
            <Route path="/ui-test" element={<UITestPage isDarkMode={false} />} />

            {/* 其他路由未来可以在这里添加 */}
            {/* <Route path="/about" element={<AboutPage />} /> */}
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* 404 页面：暂时重定向到首页 */}
            <Route path="*" element={<App />} />
          </Routes>
        </RootLayout>
      </BrowserRouter>
    </RootProvider>
  </React.StrictMode>,
)

