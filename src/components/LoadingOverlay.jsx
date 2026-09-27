export function LoadingOverlay() {
    return (
        <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:4000, color:'white'
        }}>
            <div style={{textAlign:'center'}}>
                <div style={{
                    width:50, height:50, margin:'0 auto 20px',
                    border:'3px solid #5e81ac', borderTopColor:'transparent',
                    borderRadius:'50%', animation:'spin 1s linear infinite'
                }}></div>
                <div>Signing in...</div>
            </div>
        </div>
    );
}
