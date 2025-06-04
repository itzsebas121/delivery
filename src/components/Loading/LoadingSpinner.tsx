import "./loading-spinner.css"

interface LoadingSpinnerProps {
  size?: number
}

const LoadingSpinner = ({ size = 24 }: LoadingSpinnerProps) => {
  return (
    <div
      className="loading-spinner"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  )
}

export default LoadingSpinner
