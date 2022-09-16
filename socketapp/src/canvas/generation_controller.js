import React from 'react'

class GenerationController extends React.Component{
    setGenStop(){
        console.log(this.props.mother_state.gen_tick, this.props.mother_state.AI_stroke_tables[this.props.mother_state.stroke_id][this.props.mother_state.AI_stroke_id].length)
        this.props.mother_this.AIDrawCanvas.current.socket.emit('gen_stop', {'stroke_id': this.props.mother_state.stroke_id})
        this.props.mother_this.setState({gen_start:false})
    }
    setGenStart(){
        var _this = this
        this.props.mother_this.setState({gen_start:true}, function(){
            _this.props.mother_this.AIDrawCanvas.current.initGen2(_this.props.mother_state.gen_tick)
        })
    }

    render(){
        return (<div className={'controller generation_controller'}>
            <div>
                Generation Controller
            </div>
            <div style={{display:'flex'}}>
                <div style={{display:'flex', flexGrow:1, marginRight: 5}}>
                    <input className={'intext_number_input'} type='range' max={this.props.mother_state.gen_steps} min={0} value={this.props.mother_state.gen_tick}></input>
                </div>
                <div style={{display:'flex'}}>
                    {this.props.mother_state.gen_tick<0 && <div className='btn' style={{width: 100}} disabled>Non</div>}
                    {this.props.mother_state.gen_tick>=0 && this.props.mother_state.gen_start && <div className='btn red' style={{width: 100}} onPointerDown={this.setGenStop.bind(this)}>Stop</div>}
                    {this.props.mother_state.gen_tick>=0 && this.props.mother_state.gen_start==false && <div className='btn' style={{width: 100}} onPointerDown={this.setGenStart.bind(this)}>Start</div>}
                </div>
            </div>
            
        </div>)
    }
}
export default GenerationController