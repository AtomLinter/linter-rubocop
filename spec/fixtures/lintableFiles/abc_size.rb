def defaults
  @first = model.asoc.includes(:another).find(params[:id])
  @second = model.asoc_two.includes(:another).find(params[:id_sec])
  @third = model.asoc_three.includes(:another).find(params[:id_third])
end
